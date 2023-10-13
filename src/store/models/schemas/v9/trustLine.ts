/**
 * Account Trust Lines Schema v9
 */

import Realm from 'realm';

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const TrustLineSchema = {
    schema: {
        name: 'TrustLine',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
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
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'lines' },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating TrustLine schema to v9');

        // change currency id
        const newCurrencies = newRealm.objects('Currency') as any;
        for (let i = 0; i < newCurrencies.length; i++) {
            newCurrencies[i].id = `${newCurrencies[i].issuer}.${newCurrencies[i].currency}`;
        }

        const newObjects = newRealm.objects(TrustLineSchema.schema.name) as any;

        const removeObjects = [] as any;

        for (let i = 0; i < newObjects.length; i++) {
            if (newObjects[i].linkingObjectsCount() > 0) {
                const account = newObjects[i].linkingObjects('Account', 'lines')[0] as any;
                newObjects[i].id = `${account.address}.${newObjects[i].currency.id}`;
            } else {
                removeObjects.push(newObjects[i]);
            }
        }

        // clear up not linked trust lines
        newRealm.delete(removeObjects);
    },
};

export default <ExtendedSchemaType>TrustLineSchema;
