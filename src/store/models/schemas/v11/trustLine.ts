/**
 * Account Trust Lines Schema v11
 */

import Realm from 'realm';

/* Schema  ==================================================================== */
const TrustLineSchema = {
    schema: {
        name: 'TrustLine',
        primaryKey: 'id',
        properties: {
            id: 'string',
            currency: { type: 'object', objectType: 'Currency' },
            balance: { type: 'double', default: 0 },
            transfer_rate: { type: 'double', default: 0 },
            no_ripple: { type: 'bool', default: false },
            no_ripple_peer: { type: 'bool', default: false },
            limit: { type: 'double', default: 0 },
            limit_peer: { type: 'double', default: 0 },
            quality_in: { type: 'double', default: 0 },
            quality_out: { type: 'double', default: 0 },
            authorized: { type: 'bool', default: false },
            peer_authorized: { type: 'bool', default: false },
            freeze: { type: 'bool', default: false },
            freeze_peer: { type: 'bool', default: false },
            obligation: { type: 'bool', default: false },
            order: { type: 'int', default: 0 },
            favorite: { type: 'bool', default: false },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'lines' },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating TrustLine schema to v11');

        const newObjects = newRealm.objects(TrustLineSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].order = i;
            newObjects[i].favorite = false;
        }
    },
};

export default TrustLineSchema;
