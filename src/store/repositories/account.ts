import { flatMap, has, filter, find } from 'lodash';
import Realm from 'realm';

import { AccountModel, AccountDetailsModel, CurrencyModel, TrustLineModel } from '@store/models';
import { AccessLevels, EncryptionLevels, AccountTypes } from '@store/types';

import Vault from '@common/libs/vault';

import BaseRepository from './base';

/* Events  ==================================================================== */
declare interface AccountRepository {
    on(event: 'accountUpdate', listener: (account: AccountModel, changes: Partial<AccountModel>) => void): this;
    on(event: 'accountCreate', listener: (account: AccountModel) => void): this;
    on(event: 'accountRemove', listener: () => void): this;
    on(event: string, listener: Function): this;
}

/* Repository  ==================================================================== */
class AccountRepository extends BaseRepository<AccountModel> {
    /**
     * Initialize the repository with realm instance and default model.
     * @param {Realm} realm - The realm instance.
     */
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = AccountModel;
    }

    /**
     * Adds a new account to the store.
     * @param {Partial<AccountModel>} account - Partial data for the account.
     * @param {string} [privateKey] - Private key of the account (optional).
     * @param {string} [encryptionKey] - Encryption key (optional).
     * @returns {Promise<AccountModel>} Promise that resolves to the created AccountModel.
     */
    add = async (
        account: Partial<AccountModel>,
        privateKey?: string,
        encryptionKey?: string,
    ): Promise<AccountModel> => {
        // Handle special cases for Readonly or Tangem card accounts
        if (account.accessLevel === AccessLevels.Readonly || account.type === AccountTypes.Tangem) {
            const createdAccount = await this.create(account);
            this.emit('accountCreate', createdAccount);
            return createdAccount;
        }

        // Handle full access accounts
        await Vault.create(account.publicKey, privateKey, encryptionKey);
        const createdFullAccessAccount = await this.create(account, true);
        this.emit('accountCreate', createdFullAccessAccount);
        return createdFullAccessAccount;
    };

    /**
     * Update an existing account.
     * @param {Partial<AccountModel>} object Data to update the account with.
     * @returns {Promise<AccountModel>} Updated account.
     */
    update = async (object: Partial<AccountModel>): Promise<AccountModel> => {
        // Validate object has a primary key
        if (!has(object, this.model.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }

        const updatedAccount = await this.create(object, true);
        this.emit('accountUpdate', updatedAccount, object);
        return updatedAccount;
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
                    const detailsObject = this.realm.create(
                        AccountDetailsModel.schema.name,
                        details,
                        Realm.UpdateMode.All,
                    );

                    let objectsCount = filter(account.details, { id: detailsObject.id }).length;

                    // clean up stale records
                    if (objectsCount > 1) {
                        account.details = [];
                        objectsCount = 0;
                    }

                    if (objectsCount === 0) {
                        account.details.push(detailsObject);
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
    getAccounts = (filters?: Partial<AccountModel>) => {
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
    getFullAccessAccounts = (): AccountModel[] => {
        return flatMap(this.query({ accessLevel: AccessLevels.Full }));
    };

    /**
     * get list of available accounts for spending
     */
    getSpendableAccounts = (includeHidden = false): AccountModel[] => {
        const signableAccounts = this.getSignableAccounts();

        return filter(signableAccounts, (a) => a.balance > 0 && (includeHidden ? true : !a.hidden));
    };

    /**
     * get list of available accounts for signing
     */
    getSignableAccounts = (): AccountModel[] => {
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
     * check if account is a regular key to one of Xaman accounts
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
     * Remove an account permanently.
     * WARNING: This operation is irreversible.
     * @param {AccountModel} account The account to be removed.
     * @returns {Promise<boolean>} Whether the account was successfully removed.
     */
    purge = async (account: AccountModel): Promise<boolean> => {
        // Remove private key if account has full access
        if (account.accessLevel === AccessLevels.Full) {
            await Vault.purge(account.publicKey);
        }

        // Remove account trust lines
        for (const line of account.lines) {
            await this.delete(line);
        }

        // Delete the account
        await this.delete(account);

        // Emit account removal event
        this.emit('accountRemove');

        return true;
    };
}

export default new AccountRepository();
