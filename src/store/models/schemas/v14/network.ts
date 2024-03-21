/**
 * Network Schema v14
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
            id: { type: 'int' },
            key: { type: 'string' },
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
        console.log('migrating Network schema to 14');

        // default supported networks list
        const { networks } = NetworkConfig;

        // create networks
        for (let i = 0; i < networks.length; i++) {
            newRealm.create(NetworkSchema.schema.name, {
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
};

export default <ExtendedSchemaType>NetworkSchema;
