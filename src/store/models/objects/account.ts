/**
 * Account Model
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

    public type: AccountTypes;
    public address: string;
    public label: string;
    public publicKey: string;
    public accessLevel: AccessLevels;
    public encryptionLevel: EncryptionLevels;
    public encryptionVersion: number;
    public order?: number;
    public hidden?: boolean;
    public additionalInfoString?: string;
    public registerAt?: Date;
    public updatedAt?: Date;

    // NOT accessible publicly
    private details?: AccountDetails[];

    get additionalInfo(): Object {
        return JSON.parse(this.additionalInfoString);
    }

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

    public getStateVersion() {
        const details = this.getDetails();

        if (!details) {
            return 0;
        }

        const state = JSON.stringify(details.toJSON(), (key, val) => {
            if (val != null && typeof val === 'object' && ['owners', 'currency'].includes(key)) {
                return;
            }
            // eslint-disable-next-line consistent-return
            return val;
        });
        return StringIdentifier(state);
    }

    private getDetails(): AccountDetails {
        const network = CoreRepository.getSelectedNetwork();
        const details = this.details.filter((d) => d.network.id === network.id);

        if (details) {
            return details[0];
        }

        return undefined;
    }
}

export default Account;
