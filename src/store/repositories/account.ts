import { first, has, filter, find } from 'lodash';
import Realm, { Results, ObjectSchema } from 'realm';

import Flag from '@common/libs/ledger/parser/common/flag';
import Vault from '@common/libs/vault';

import { AccountSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels, AccountTypes } from '@store/types';

import Localize from '@locale';

import BaseRepository from './base';

// events
declare interface AccountRepository {
    on(event: 'changeDefaultAccount', listener: (defaultAccount: AccountSchema) => void): this;
    on(event: 'accountUpdate', listener: (account: AccountSchema) => void): this;
    on(event: 'accountCreate', listener: (account: AccountSchema) => void): this;
    on(event: 'accountRemove', listener: () => void): this;
    on(event: string, listener: Function): this;
}

/* Repository  ==================================================================== */
class AccountRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = AccountSchema.schema;
    }

    /**
     * add new regular account to the store
     * this will store private key in the vault if full access
     */
    add = (account: Partial<AccountSchema>, privateKey?: string, encryptionKey?: string): Promise<AccountSchema> => {
        // remove default flag from any other account
        const defaultAccount = this.getDefaultAccount();
        if (defaultAccount && defaultAccount.address !== account.address) {
            this.update({
                address: defaultAccount.address,
                default: false,
            });
        }

        // READONLY || TANGEM CARD
        if (account.accessLevel === AccessLevels.Readonly || account.type === AccountTypes.Tangem) {
            return this.create(account).then((createdAccount: AccountSchema) => {
                this.emit('accountCreate', createdAccount);
                this.emit('changeDefaultAccount', createdAccount);
                return createdAccount;
            });
        }

        // FULLACCESS
        return Vault.create(account.publicKey, privateKey, encryptionKey).then(() => {
            return this.create(account, true).then((createdAccount: AccountSchema) => {
                this.emit('accountCreate', createdAccount);
                this.emit('changeDefaultAccount', createdAccount);
                return createdAccount;
            });
        });
    };

    update = (object: Partial<AccountSchema>): Promise<AccountSchema> => {
        // the primary key should be in the object
        if (!has(object, 'address')) {
            throw new Error('Update require primary key to be set');
        }

        return this.create(object, true).then((updatedAccount: AccountSchema) => {
            this.emit('accountUpdate', updatedAccount);
            return updatedAccount;
        });
    };

    /**
     * get default account
     */
    getDefaultAccount = (): AccountSchema => {
        return this.findOne({ default: true });
    };

    /**
     * get list all accounts
     */
    getAccounts = (filters?: Partial<AccountSchema>): Results<AccountSchema> => {
        // sorted('default', true) will put the default account on top
        if (filters) {
            return this.query(filters);
        }
        return this.findAll();
    };

    /**
     * get list of available accounts for spending
     */
    getSpendableAccounts = (includeHidden = false): Array<AccountSchema> => {
        const signableAccounts = this.getSignableAccounts();

        return filter(signableAccounts, (a) => a.balance > 0 && (includeHidden ? true : !a.hidden));
    };

    /**
     * get list of available accounts for signing
     */
    getSignableAccounts = (): Array<AccountSchema> => {
        const accounts = this.findAll();

        const availableAccounts = [] as Array<AccountSchema>;

        accounts.forEach((account: AccountSchema) => {
            if (account.accessLevel === AccessLevels.Full) {
                // check if master key is disable and regular key not imported
                if (account.regularKey) {
                    const flags = new Flag('Account', account.flags);
                    const accountFlags = flags.parse();

                    // eslint-disable-next-line max-len
                    const regularKeyImported = !this.query({
                        address: account.regularKey,
                        accessLevel: AccessLevels.Full,
                    }).isEmpty();

                    if ((accountFlags.disableMasterKey && regularKeyImported) || !accountFlags.disableMasterKey) {
                        availableAccounts.push(account);
                    }
                } else {
                    availableAccounts.push(account);
                }
            } else if (
                // Readonly but the regular Key imported as full access
                account.regularKey &&
                !this.query({ address: account.regularKey, accessLevel: AccessLevels.Full }).isEmpty()
            ) {
                availableAccounts.push(account);
            }
        });

        return availableAccounts;
    };

    /**
     * check if account is a regular key to one of xumm accounts
     */
    isRegularKey = (address: string) => {
        return !this.findBy('regularKey', address).isEmpty();
    };

    /**
     * check if account is signable
     */
    isSignable = (account: AccountSchema): boolean => {
        if (account.accessLevel === AccessLevels.Full) {
            return true;
        }
        return !!find(this.getSignableAccounts(), (o) => o.address === account.address);
    };

    /**
     * set/change default account
     */
    setDefaultAccount = (address: string) => {
        // update current default
        const current = this.getDefaultAccount();

        // set the current account default -> false
        // if any exist
        if (current) {
            this.update({
                address: current.address,
                default: false,
            });
        }

        // set the new account default -> true
        this.update({
            address,
            default: true,
        });

        const newDefaultAccount = this.getDefaultAccount();

        // emit changeDefaultAccount event
        this.emit('changeDefaultAccount', newDefaultAccount);
    };

    /**
     * Downgrade access level to readonly
     * WARNING: this will remove private key from keychain
     */
    downgrade = (account: AccountSchema): boolean => {
        // it's already readonly
        if (account.accessLevel === AccessLevels.Readonly) return true;

        // remove private key from vault
        Vault.purge(account.publicKey);

        // set the access level to Readonly
        this.update({
            address: account.address,
            accessLevel: AccessLevels.Readonly,
            encryptionLevel: EncryptionLevels.None,
        });

        return true;
    };

    getNewDefaultAccount = (ignoreAccount?: string) => {
        let newDefaultAccount;

        let accounts = this.getAccounts().toJSON();

        if (accounts.length === 0) return undefined;

        if (ignoreAccount) {
            accounts = filter(accounts, (a) => a.address !== ignoreAccount);
        }

        // first try to find the first not hidden account
        newDefaultAccount = first(filter(accounts, (a) => a.hidden === false));

        // if no not hidden account is available then choose one can account and make it visible
        if (!newDefaultAccount) {
            newDefaultAccount = first(accounts);
            if (newDefaultAccount && newDefaultAccount.hidden) {
                this.update({
                    address: newDefaultAccount.address,
                    hidden: false,
                });
            }
        }

        return newDefaultAccount;
    };

    /**
     * Change account visibility
     */
    changeAccountVisibility = (account: AccountSchema, hidden: boolean) => {
        return new Promise<void>((resolve, reject) => {
            // if enable check prevent if this is the latest account getting hidden
            if (hidden === true) {
                const allAccounts = this.getAccounts();
                const hiddenAccounts = this.getAccounts({ hidden: true });

                if (allAccounts.length - hiddenAccounts.length === 1) {
                    reject(new Error(Localize.t('account.unableToHideAllAccountsError')));
                    return;
                }

                // if account is default change default to another account
                if (account.default) {
                    const newDefaultAccount = this.getNewDefaultAccount(account.address);
                    if (newDefaultAccount) {
                        this.setDefaultAccount(newDefaultAccount.address);
                    }
                }
            }

            // update account hidden value
            this.update({
                address: account.address,
                hidden,
            });

            resolve();
        });
    };

    /**
     * Remove account
     * WARNING: this will be permanently and cannot be undo
     */
    purge = async (account: AccountSchema): Promise<boolean> => {
        const isDefault = account.default;
        // remove private key from vault
        if (account.accessLevel === AccessLevels.Full) {
            await Vault.purge(account.publicKey);
        }

        // remove the account
        await this.deleteBy('address', account.address);

        // if account is default then set new default account
        if (isDefault) {
            const newDefaultAccount = this.getNewDefaultAccount();
            if (newDefaultAccount) {
                this.setDefaultAccount(newDefaultAccount.address);
            } else {
                // emit new default account
                this.emit('changeDefaultAccount', undefined);
            }
        }

        // emit the account remove event
        this.emit('accountRemove');

        return true;
    };

    /**
     * Purge All accounts
     * WARNING: this will be permanently and cannot be undo
     */
    purgePrivateKeys = (): boolean => {
        // clear the vault
        const accounts = this.getAccounts({ accessLevel: AccessLevels.Full });
        accounts.forEach((a) => {
            Vault.purge(a.publicKey);
        });

        return true;
    };
}

export default new AccountRepository();
