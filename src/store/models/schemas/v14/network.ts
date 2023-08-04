/**
 * Network Schema
 */

import Realm from 'realm';
import { NetworkConfig } from '@common/constants';

/* Schema  ==================================================================== */
const NetworkSchema = {
    schema: {
        name: 'Network',
        primaryKey: 'id',
        properties: {
            id: { type: 'int' },
            key: { type: 'string' },
            name: { type: 'string' },
            color: { type: 'string' },
            type: { type: 'string' },
            nativeAsset: { type: 'string' },
            baseReserve: { type: 'double', default: NetworkConfig.baseReserve },
            ownerReserve: { type: 'double', default: NetworkConfig.ownerReserve },
            defaultNode: { type: 'Node' },
            nodes: { type: 'list', objectType: 'Node' },
            definitionsString: { type: 'string?' },
            amendments: { type: 'list', objectType: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    /*
    Populate networks to the data store
    Note: this is necessary in the process of migration and also fresh install
    */
    populate: (realm: Realm) => {
        // default supported networks list
        const { networks } = NetworkConfig;

        // create networks
        for (let i = 0; i < networks.length; i++) {
            realm.create(NetworkSchema.schema.name, {
                id: networks[i].networkId,
                key: networks[i].key,
                name: networks[i].name,
                nativeAsset: networks[i].nativeAsset,
                color: networks[i].color,
                type: networks[i].type,
                baseReserve: NetworkConfig.baseReserve,
                ownerReserve: NetworkConfig.ownerReserve,
                amendments: [],
                definitionsString: '',
                registerAt: new Date(),
                updatedAt: new Date(),
            });
        }
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Network schema to 14');

        // populate networks
        NetworkSchema.populate(newRealm);
    },
};

export default NetworkSchema;
