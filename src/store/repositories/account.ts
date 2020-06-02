import { has, isEmpty, filter } from 'lodash';
import Realm, { Results, ObjectSchema } from 'realm';

import Vault from '@common/libs/vault';

import { AccountSchema } from '@store/schemas/latest';

import { AccessLevels, EncryptionLevels } from '@store/types';
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
     * add new account to the store
     * this will store private key in the vault if full access
     */
    add = (account: Partial<AccountSchema>, privateKey?: string, encryptionKey?: string): Promise<AccountSchema> => {
        // remove default flag from any other account
        const defaultAccount = this.getDefaultAccount();
        if (!isEmpty(defaultAccount) && defaultAccount.address !== account.address) {
            this.update({
                address: defaultAccount.address,
                default: false,
            });
        }

        // READONLY
        if (account.accessLevel === AccessLevels.Readonly) {
            // create
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
    getSpendableAccounts = (): Array<AccountSchema> => {
        const accounts = this.findAll();

        const availableAccounts = [] as Array<AccountSchema>;

        accounts.forEach((account: AccountSchema) => {
            if (account.accessLevel === AccessLevels.Full) {
                availableAccounts.push(account);
                // check if the regular key account is imported
            } else if (
                account.regularKey &&
                !this.query({ address: account.regularKey, accessLevel: AccessLevels.Full }).isEmpty()
            ) {
                availableAccounts.push(account);
            }
        });

        return filter(availableAccounts, (a) => a.balance > 0);
    };

    /**
     * check if account is a regular key to one of xumm accounts
     */
    isRegularKey = (account: AccountSchema) => {
        return !this.findBy('regularKey', account.address).isEmpty();
    };

    /**
     * set/change default account
     */
    setDefaultAccount = (address: string) => {
        // update current default
        const current = this.getDefaultAccount();

        // set the current account default -> false
        // if any exist
        if (!isEmpty(current)) {
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

        // if account is default then change default account to closest account
        if (isDefault) {
            const accounts = this.getAccounts();

            if (accounts.length > 0) {
                this.setDefaultAccount(accounts[0].address);
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
