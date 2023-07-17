/**
 * Currency Schema v12
 */

import Realm from 'realm';

/* Schema  ==================================================================== */
const CurrencySchema = {
    schema: {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: 'string',
            issuer: 'string',
            currency: 'string',
            name: 'string?',
            avatar: 'string?',
            shortlist: { type: 'bool', default: true },
            xapp_identifier: 'string?',
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Currency schema to v12');

        const newObjects = newRealm.objects(CurrencySchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].xapp_identifier = undefined;
        }
    },
};

export default CurrencySchema;
