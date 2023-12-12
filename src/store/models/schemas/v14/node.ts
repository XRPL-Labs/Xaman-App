/**
 * Node Schema v14
 */

import Realm from 'realm';

import { NetworkConfig } from '@common/constants';
import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const NodeSchema = {
    schema: {
        name: 'Node',
        primaryKey: 'id',
        properties: {
            id: { type: 'objectId' },
            endpoint: { type: 'string' },
            owners: { type: 'linkingObjects', objectType: 'Network', property: 'nodes' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    populate: (realm: Realm) => {
        const networks = realm.objects('Network') as any;

        for (let i = 0; i < networks.length; i++) {
            const network = networks[i];
            const networkConfig = NetworkConfig.networks.find((net) => net.networkId === network.id);
            const createdNodes = [] as any[];

            for (let y = 0; y < networkConfig.nodes.length; y++) {
                createdNodes.push(
                    // @ts-ignore
                    realm.create(NodeSchema.schema.name, {
                        id: new Realm.BSON.ObjectId(),
                        endpoint: networkConfig.nodes[y],
                        registerAt: new Date(),
                        updatedAt: new Date(),
                    }),
                );
            }

            // set the created nodes to the network
            network.nodes = createdNodes;
            // eslint-disable-next-line prefer-destructuring
            network.defaultNode = createdNodes[0];
        }
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Node schema to v14');

        // populate nodes
        NodeSchema.populate(newRealm);
    },
};

export default <ExtendedSchemaType>NodeSchema;
