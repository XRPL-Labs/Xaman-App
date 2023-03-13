/**
 * Account Model
 */

import Realm from 'realm';

import { EncryptionLevels, AccessLevels, AccountTypes } from '@store/types';

class Account extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            type: { type: 'string', default: AccountTypes.Regular },
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: 'string?',
            regularKey: 'string?',
            accessLevel: 'string',
            encryptionLevel: 'string',
            encryptionVersion: 'int?',
            additionalInfoString: 'string?',
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            order: { type: 'int', default: 0 },
            hidden: { type: 'bool', default: false },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public type?: AccountTypes;
    public address?: string;
    public label?: string;
    public balance?: number;
    public ownerCount?: number;
    public sequence?: number;
    public publicKey?: string;
    public regularKey?: string;
    public accessLevel?: AccessLevels;
    public encryptionLevel?: EncryptionLevels;
    public encryptionVersion?: number;
    public flags?: number;
    public default?: boolean;
    public order?: number;
    public hidden?: boolean;
    public lines?: any;
    public registerAt?: Date;
    public updatedAt?: Date;

    public isValid: () => boolean;
    [index: string]: any;

    get additionalInfo(): Object {
        return JSON.parse(this.additionalInfoString);
    }

    set additionalInfo(data: Object) {
        this.additionalInfoString = JSON.stringify(data);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('Migrating Account model to 12');

        const newObjects = newRealm.objects('Account') as Account[];

        for (let i = 0; i < newObjects.length; i++) {
            // set default encryption version to 1
            if ([EncryptionLevels.Passcode, EncryptionLevels.Passphrase].includes(newObjects[i].encryptionLevel)) {
                newObjects[i].encryptionVersion = 1;
            }
        }
    }
}

export default Account;
