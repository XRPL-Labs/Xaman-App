import Realm from 'realm';

import { NetworkModel, NodeModel } from '@store/models/objects';

import { NetworkConfig } from '@common/constants';

/**
 * Populates networks
 *
 * @param {Realm} realm - The realm to populate networks into.
 * @returns {void}
 */
export const populateNetworks = (realm: Realm): void => {
    // default supported networks list
    const { networks } = NetworkConfig;

    // create networks
    for (let i = 0; i < networks.length; i++) {
        realm.create(NetworkModel.schema.name, {
            id: new Realm.BSON.ObjectId(),
            key: networks[i].key,
            networkId: networks[i].networkId,
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
};

/**
 * Populates nodes
 *
 * @param {Realm} realm - The Realm instance to populate nodes for.
 * @returns {void}
 */
export const populateNodes = (realm: Realm): void => {
    const networks = realm.objects<NetworkModel>(NetworkModel.schema.name);

    for (let i = 0; i < networks.length; i++) {
        const network = networks[i];
        const networkConfig = NetworkConfig.networks.find((net) => net.key === network.key);
        const createdNodes: NodeModel[] = [];

        for (let y = 0; y < networkConfig!.nodes.length; y++) {
            createdNodes.push(
                realm.create<NodeModel>(NodeModel.schema.name, {
                    id: new Realm.BSON.ObjectId(),
                    endpoint: networkConfig!.nodes[y],
                    registerAt: new Date(),
                    updatedAt: new Date(),
                }),
            );
        }

        // set the created nodes to the network
        network.nodes = createdNodes as unknown as Realm.List<NodeModel>;
        // eslint-disable-next-line prefer-destructuring
        network.defaultNode = createdNodes[0];
    }
};

/**
 * Populates the Core object
 *
 * @param {Realm} realm - The Realm object to populate.
 * @returns {void}
 */
export const populateCore = (realm: Realm): void => {
    // get all networks
    const networks = realm.objects<NetworkModel>(NetworkModel.schema.name);

    const { defaultNetworkId } = NetworkConfig;
    const selectedNetwork = networks.find((network) => network.networkId === defaultNetworkId);

    realm.create('Core', {
        network: selectedNetwork,
    });
};

/**
 * Populates the given realm with networks, nodes, and core.
 *
 * @param {Realm} realm - The Realm instance to populate.
 */
export const populateDataStore = (realm: Realm) => {
    [populateNetworks, populateNodes, populateCore].forEach((fn) => {
        realm.write(() => {
            fn(realm);
        });
    });
};
