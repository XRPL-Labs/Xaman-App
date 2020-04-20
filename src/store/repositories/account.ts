import { has, isEmpty } from 'lodash';
import Realm, { Results, ObjectSchema } from 'realm';

import * as AccountLib from 'xrpl-accountlib';

import Vault from '@common/libs/vault';

import { AccountSchema } from '@store/schemas/latest';

import { AccessLevels, EncryptionLevels } from '@store/types';
import BaseRepository from './base';

/* types  ==================================================================== */
type AddAccountParams = {
    account: AccountLib.XRPL_Account;
    encryptionKey?: string;
    encryptionLevel: EncryptionLevels;
    accessLevel?: AccessLevels;
    label?: string;
};

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
     * this will store private key in the vault
     */
    add = (params: AddAccountParams): Promise<AccountSchema> => {
        const { account, encryptionKey, encryptionLevel, label, accessLevel } = params;

        // check if there is any default account if
        // it's upgrading so we don't want to remove the default flag
        const defaultAccount = this.getDefaultAccount();
        if (!isEmpty(defaultAccount) && defaultAccount.address !== account.address) {
            this.update({
                address: defaultAccount.address,
                default: false,
            });
        }

        // if the account is readonly
        if (accessLevel === AccessLevels.Readonly) {
            const newAccount = {
                address: account.address,
                accessLevel: AccessLevels.Readonly,
                encryptionLevel: EncryptionLevels.None,
                default: true,
            } as Partial<AccountSchema>;
            // assign label if set
            if (label) newAccount.label = label;
            // create
            return this.create(newAccount).then((createdAccount: AccountSchema) => {
                this.emit('accountCreate', createdAccount);
                this.emit('changeDefaultAccount', createdAccount);
                return createdAccount;
            });
        }

        // else for sure we have full access
        const { keypair } = account;

        // save the privateKey in the vault
        return Vault.create(keypair.publicKey, keypair.privateKey, encryptionKey).then(() => {
            const newAccount = {
                publicKey: keypair.publicKey,
                accessLevel: AccessLevels.Full,
                address: account.address,
                encryptionLevel,
                default: true,
            } as Partial<AccountSchema>;

            // assign label if set
            if (label) newAccount.label = label;

            return this.create(newAccount, true).then((createdAccount: AccountSchema) => {
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
        accounts.forEach(a => {
            Vault.purge(a.publicKey);
        });

        return true;
    };
}

export default new AccountRepository();
