/**
 * Account Schema v2
 */

import Realm from 'realm';

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const AccountSchema = {
    schema: {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: { type: 'string', optional: true },
            regularKey: { type: 'string', optional: true },
            accessLevel: { type: 'string' },
            encryptionLevel: { type: 'string' },
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            order: { type: 'int', default: 0 },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Account schema to v2');

        const newObjects = newRealm.objects(AccountSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            // set the right order
            newObjects[i].order = i;
        }
    },
};

export default <ExtendedSchemaType>AccountSchema;
