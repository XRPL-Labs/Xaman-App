/**
 * Counter Parties Schema v4
 */

import Realm from 'realm';

/* Schema  ==================================================================== */
const CounterPartySchema = {
    schema: {
        name: 'CounterParty',
        primaryKey: 'id',
        properties: {
            id: { type: 'int' },
            name: { type: 'string', indexed: true },
            avatar: 'string',
            domain: 'string',
            shortlist: { type: 'bool', default: true },
            currencies: { type: 'list', objectType: 'Currency' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating CounterParty schema to v4');

        const newObjects = newRealm.objects(CounterPartySchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].shortlist = true;
        }
    },
};

export default CounterPartySchema;
