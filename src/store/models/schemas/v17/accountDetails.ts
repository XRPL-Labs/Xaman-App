/**
 * Account Details Schema v17
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const AccountDetailsSchema = {
    schema: {
        name: 'AccountDetails',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            network: { type: 'object', objectType: 'Network' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            regularKey: { type: 'string', optional: true },
            domain: { type: 'string', optional: true },
            emailHash: { type: 'string', optional: true },
            messageKey: { type: 'string', optional: true },
            flagsString: { type: 'string', optional: true },
            accountIndex: { type: 'string', optional: true },
            importSequence: { type: 'int', optional: true },
            lines: { type: 'list', objectType: 'TrustLine' },
            reward: { type: 'dictionary', objectType: 'mixed', optional: true },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'details' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating AccountDetails schema to 17');

        const newObjects = newRealm.objects(AccountDetailsSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].importSequence = 0;
        }
    },
};

export default <ExtendedSchemaType>AccountDetailsSchema;
