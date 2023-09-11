import { flatMap, has, filter, find } from 'lodash';
import Realm, { Results } from 'realm';

import { AccountModel, AccountDetailsModel, CurrencyModel, TrustLineModel } from '@store/models';
import { AccessLevels, EncryptionLevels, AccountTypes } from '@store/types';

import Vault from '@common/libs/vault';

import BaseRepository from './base';
/* Events  ==================================================================== */
declare interface AccountRepository {
    on(event: 'changeDefaultAccount', listener: (defaultAccount: AccountModel) => void): this;
    on(event: 'accountUpdate', listener: (account: AccountModel, changes: Partial<AccountModel>) => void): this;
    on(event: 'accountCreate', listener: (account: AccountModel) => void): this;
    on(event: 'accountRemove', listener: () => void): this;
    on(event: string, listener: Function): this;
}

/* Repository  ==================================================================== */
class AccountRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = AccountModel.schema;
    }

    /**
     * add new regular account to the store
     * this will store private key in the vault if full access
     */
    add = (account: Partial<AccountModel>, privateKey?: string, encryptionKey?: string): Promise<AccountModel> => {
        // READONLY || TANGEM CARD
        if (account.accessLevel === AccessLevels.Readonly || account.type === AccountTypes.Tangem) {
            return this.create(account).then((createdAccount: AccountModel) => {
                this.emit('accountCreate', createdAccount);
                return createdAccount;
            });
        }

        // FULL ACCESS
        return Vault.create(account.publicKey, privateKey, encryptionKey).then(() => {
            return this.create(account, true).then((createdAccount: AccountModel) => {
                this.emit('accountCreate', createdAccount);
                return createdAccount;
            });
        });
    };

    /**
     * update account object
     */
    update = (object: Partial<AccountModel>): Promise<AccountModel> => {
        // the primary key should be in the object
        if (!has(object, this.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }

        return this.create(object, true).then((updatedAccount: AccountModel) => {
            this.emit('accountUpdate', updatedAccount, object);
            return updatedAccount;
        });
    };

    /**
     * update account details
     */
    updateDetails = (address: string, details: Partial<AccountDetailsModel>): Promise<AccountModel> => {
        // the primary key should be in the object
        if (!address) {
            throw new Error('Update require primary key to be set');
        }

        if (!has(details, 'id')) {
            throw new Error('Update details requires id to be set!');
        }

        return new Promise((resolve, reject) => {
            try {
                this.safeWrite(() => {
                    const account = this.findOne({ address });
                    const object = this.realm.create(AccountDetailsModel.schema.name, details, Realm.UpdateMode.All);

                    if (!account.details.find((d: any) => d.id === object.id)) {
                        account.details.push(object);
                    }

                    this.emit('accountUpdate', account, details);
                    resolve(account);
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * get list all accounts
     */
    getAccounts = (filters?: Partial<AccountModel>): Results<AccountModel> => {
        // sorted('default', true) will put the default account on top
        if (filters) {
            return this.query(filters);
        }
        return this.findAll();
    };

    /**
     * get all accounts count
     */
    getVisibleAccountCount = (): number => {
        return this.query({ hidden: false }).length;
    };

    /**
     * get list of accounts with full access
     */
    getFullAccessAccounts = (): Array<AccountModel> => {
        return flatMap(this.query({ accessLevel: AccessLevels.Full }));
    };

    /**
     * get list of available accounts for spending
     */
    getSpendableAccounts = (includeHidden = false): Array<AccountModel> => {
        const signableAccounts = this.getSignableAccounts();

        return filter(signableAccounts, (a) => a.balance > 0 && (includeHidden ? true : !a.hidden));
    };

    /**
     * get list of available accounts for signing
     */
    getSignableAccounts = (): Array<AccountModel> => {
        const accounts = this.findAll();

        const availableAccounts = [] as Array<AccountModel>;

        accounts.forEach((account: AccountModel) => {
            if (account.accessLevel === AccessLevels.Full) {
                // check if master key is disable and regular key not imported
                if (account.regularKey) {
                    // eslint-disable-next-line max-len
                    const regularKeyImported = !this.query({
                        address: account.regularKey,
                        accessLevel: AccessLevels.Full,
                    }).isEmpty();

                    if ((account.flags?.disableMasterKey && regularKeyImported) || !account.flags?.disableMasterKey) {
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
    getRegularKeys = (address: string): AccountModel[] => {
        return filter(this.findAll(), (a) => a.regularKey === address);
    };

    /**
     * check if account is signable
     */
    isSignable = (account: AccountModel): boolean => {
        return !!find(this.getSignableAccounts(), (o) => o.address === account.address);
    };

    /**
     * check if account has currency
     */
    hasCurrency = (account: AccountModel, currency: Partial<CurrencyModel>): boolean => {
        let found = false;

        account.lines.forEach((t: TrustLineModel) => {
            if (t.currency.issuer === currency.issuer && t.currency.currency === currency.currency) {
                found = true;
            }
        });

        return found;
    };

    /**
     * Downgrade access level to readonly
     * WARNING: this will remove private key from keychain
     */
    downgrade = (account: AccountModel): boolean => {
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
     * WARNING: this will be permanently and irreversible
     */
    purge = async (account: AccountModel): Promise<boolean> => {
        // remove private key from vault
        if (account.accessLevel === AccessLevels.Full) {
            await Vault.purge(account.publicKey);
        }

        // remove account lines
        for (const line of account.lines) {
            await this.delete(line);
        }

        // remove the account
        await this.delete(account);

        // emit the account remove event
        this.emit('accountRemove');

        return true;
    };
}

export default new AccountRepository();
