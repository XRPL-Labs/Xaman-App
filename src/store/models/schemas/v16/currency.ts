/**
 * Currency Schema 16
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
            currencyCode: { type: 'string' },
            name: { type: 'string', optional: true },
            avatar: { type: 'string', optional: true },
            shortlist: { type: 'bool', default: true },
            xapp_identifier: { type: 'string', optional: true },
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Currency schema to v16');

        const oldObjects = oldRealm.objects(CurrencySchema.schema.name) as any;
        const newObjects = newRealm.objects(CurrencySchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].currencyCode = oldObjects.find((c: any) => c.id === newObjects[i].id).currency;
        }
    },
};

export default <ExtendedSchemaType>CurrencySchema;
