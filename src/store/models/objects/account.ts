/**
 * Account model
 *
 * @class
 * @extends Realm.Object
 */

import get from 'lodash/get';
import Realm from 'realm';

import { StringIdentifier } from '@common/utils/string';

import CoreRepository from '@store/repositories/core';

import { AccountSchema } from '@store/models/schemas/latest';
import { EncryptionLevels, AccessLevels, AccountTypes } from '@store/types';

import AccountDetails from './accountDetails';

/* Model  ==================================================================== */
class Account extends Realm.Object<Account> {
    public static schema: Realm.ObjectSchema = AccountSchema.schema;

    /** Type of the account. @type {AccountTypes} */
    public type: AccountTypes;
    /** Address of the account. @type {string} */
    public address: string;
    /** Label of the account. @type {string} */
    public label: string;
    /** Public key associated with the account. @type {string} */
    public publicKey: string;
    /** Access level of the account. @type {AccessLevels} */
    public accessLevel: AccessLevels;
    /** Encryption level for the account. @type {EncryptionLevels} */
    public encryptionLevel: EncryptionLevels;
    /** CipherEncryption version used to encrypt this account. @type {number} */
    public encryptionVersion: number;
    /** Index Order of the account when showing as list, if any. @type {number?} */
    public order?: number;
    /** Whether the account is hidden in the accounts list. @type {boolean?} */
    public hidden?: boolean;
    /** Additional information string about the account (contains stringify version of object). @type {string?} */
    public additionalInfoString?: string;
    /** Detailed data associated with the account. @type {AccountDetails[]?} */
    public details?: AccountDetails[];
    /** Date when the account was registered. @type {Date?} */
    public registerAt?: Date;
    /** Date when the account was last updated. @type {Date?} */
    public updatedAt?: Date;

    /**
     * Returns the parsed additional information object.
     * @type {Object}
     */
    get additionalInfo(): Object {
        return JSON.parse(this.additionalInfoString);
    }

    /**
     * Set the additional information after stringify it.
     */
    set additionalInfo(data: Object) {
        this.additionalInfoString = JSON.stringify(data);
    }

    get balance(): number {
        return get(this.getDetails(), 'balance', 0);
    }

    get ownerCount() {
        return get(this.getDetails(), 'ownerCount', 0);
    }

    get regularKey() {
        return get(this.getDetails(), 'regularKey', undefined);
    }

    get domain() {
        return get(this.getDetails(), 'domain', undefined);
    }

    get emailHash() {
        return get(this.getDetails(), 'emailHash', undefined);
    }

    get messageKey() {
        return get(this.getDetails(), 'messageKey', undefined);
    }

    get flags(): { [key: string]: boolean } {
        return get(this.getDetails(), 'flags', undefined);
    }

    get lines() {
        return get(this.getDetails(), 'lines', undefined);
    }

    /**
     * Calculates and retrieves the state version of the account based on its details.
     * @returns {number} The state version identifier.
     */
    public getStateVersion(): number {
        const details = this.getDetails();

        if (!details) {
            return 0;
        }

        const state = JSON.stringify(details.toJSON(), (key, val) => {
            if (val !== null && typeof val === 'object') {
                if (['owners', 'currency'].includes(key)) {
                    return undefined; // exclude these fields
                }
            }
            return val;
        });
        return StringIdentifier(state);
    }

    /**
     * Gets the details of the account based on the selected network.
     * @private
     * @returns {AccountDetails} The details of the account for the selected network.
     */
    private getDetails(): AccountDetails {
        const network = CoreRepository.getSelectedNetwork();
        return this.details.find((details) => network?.id.equals(details.network?.id));
    }
}

export default Account;
