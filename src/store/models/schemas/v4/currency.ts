/**
 * Currency Schema v4
 */

import Realm from 'realm';

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const CurrencySchema = {
    schema: {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            issuer: { type: 'string' },
            currency: { type: 'string' },
            name: { type: 'string', optional: true },
            avatar: { type: 'string', optional: true },
            shortlist: { type: 'bool', default: true },
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Currency schema to v4');

        const newObjects = newRealm.objects(CurrencySchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].shortlist = true;
        }
    },
};

export default <ExtendedSchemaType>CurrencySchema;
