/**
 * Account Model
 */

import Realm from 'realm';

import { EncryptionLevels, AccessLevels } from '@store/types';

class Account extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: 'string?',
            regularKey: 'string?',
            accessLevel: 'string',
            encryptionLevel: 'string',
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public address?: string;
    public label?: string;
    public balance?: number;
    public ownerCount?: number;
    public sequence?: number;
    public publicKey?: string;
    public regularKey?: string;
    public accessLevel?: AccessLevels;
    public encryptionLevel?: EncryptionLevels;
    public flags?: number;
    public default?: boolean;
    public lines?: any;
    public registerAt?: Date;
    public updatedAt?: Date;

    [index: string]: any;
}

export default Account;
