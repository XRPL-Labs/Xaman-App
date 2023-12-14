/**
 * Network Schema v15
 */

import Realm from 'realm';

import { NetworkConfig } from '@common/constants';
import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const NetworkSchema = {
    schema: {
        name: 'Network',
        primaryKey: 'id',
        properties: {
            id: { type: 'objectId' },
            key: { type: 'string' },
            networkId: { type: 'int' },
            name: { type: 'string' },
            color: { type: 'string' },
            type: { type: 'string' },
            nativeAsset: { type: 'dictionary', objectType: 'string' },
            baseReserve: { type: 'double', default: NetworkConfig.baseReserve },
            ownerReserve: { type: 'double', default: NetworkConfig.ownerReserve },
            defaultNode: { type: 'object', objectType: 'Node' },
            nodes: { type: 'list', objectType: 'Node' },
            definitionsString: { type: 'string', optional: true },
            amendments: { type: 'list', objectType: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Network schema to 15');

        // get network objects
        const oldNetworks = oldRealm.objects('Network') as unknown as any[];
        const newNetworks = newRealm.objects('Network') as unknown as any[];

        // New field `networkId`
        // Modified type field `id`
        for (let i = 0; i < newNetworks.length; i++) {
            newNetworks[i].id = new Realm.BSON.ObjectId();
            newNetworks[i].networkId = oldNetworks.find((network) => network.key === newNetworks[i].key).id;
        }
    },
};

export default <ExtendedSchemaType>NetworkSchema;
