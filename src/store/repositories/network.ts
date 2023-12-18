import Realm from 'realm';
import { get, has } from 'lodash';

import { NetworkModel, NodeModel } from '@store/models';
import { NetworkRailsChanges, NetworkRailsChangesType, NetworkType } from '@store/types';

import NodeRepository from './node';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class NetworkRepository extends BaseRepository<NetworkModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = NetworkModel;
    }

    add = (network: Partial<NetworkModel>) => {
        // check if network is already exist
        const exist = !this.query({ id: network.id }).isEmpty();

        if (exist) {
            throw new Error(`Network already exists with id ${network.id}`);
        }

        return this.create(network);
    };

    getNetworks = (filters?: Partial<NetworkModel>) => {
        if (filters) {
            return this.query(filters);
        }
        return this.findAll();
    };

    update = (object: Partial<NetworkModel>) => {
        // the primary key should be in the object
        if (!has(object, this.model.schema.primaryKey)) {
            throw new Error(`Update require primary key ${this.model.schema.primaryKey} to be set`);
        }
        return this.create(object, true);
    };

    getNetworkChanges = (rails: XamanBackend.NetworkRailsResponse): NetworkRailsChanges => {
        // check for duplicate keys in the response, should never happens
        const railsNetworkKeys = Object.keys(rails);
        if (railsNetworkKeys.length !== new Set(railsNetworkKeys).size) {
            throw new Error('Duplicate keys found in the rails response');
        }

        // keep track of changes
        const changes = {} as NetworkRailsChanges;

        // added || existing network
        railsNetworkKeys.forEach((networkKey) => {
            // default changes
            changes[networkKey] = [];

            const remoteNetwork = rails[networkKey];
            const localeNetwork = this.findOne({ key: networkKey });

            // new network is added
            if (!localeNetwork) {
                changes[networkKey].push({
                    type: NetworkRailsChangesType.AddedNetwork,
                    value: remoteNetwork.name,
                });
                remoteNetwork.endpoints.forEach((node) => {
                    changes[networkKey].push({
                        type: NetworkRailsChangesType.AddedNode,
                        value: node.url,
                    });
                });
                return;
            }

            // added new node
            remoteNetwork.endpoints.forEach((endpoint) => {
                if (!localeNetwork.nodes.find((node) => endpoint.url === node.endpoint)) {
                    changes[networkKey].push({
                        type: NetworkRailsChangesType.AddedNode,
                        value: endpoint.url,
                    });
                }
            });

            // removed node
            localeNetwork.nodes.forEach((node) => {
                if (!remoteNetwork.endpoints.find((endpoint) => endpoint.url === node.endpoint)) {
                    changes[networkKey].push({
                        type: NetworkRailsChangesType.RemovedNode,
                        value: node.endpoint,
                    });
                }
            });

            // changed property
            [
                { locale: 'name', remote: 'name', label: 'Name' },
                { locale: 'color', remote: 'color', label: 'Color' },
                { locale: 'nativeAsset.asset', remote: 'native_asset', label: 'Native Asset' },
                { locale: 'nativeAsset.icon', remote: 'icons.icon_asset', label: 'Native Asset Icon' },
                { locale: 'nativeAsset.iconSquare', remote: 'icons.icon_square', label: 'Native Asset Icon Square' },
            ].forEach((property) => {
                if (get(remoteNetwork, property.remote) !== get(localeNetwork, property.locale)) {
                    changes[networkKey].push({
                        type: NetworkRailsChangesType.ChangedProperty,
                        value: property.label,
                    });
                }
            });
        });

        // removed networks
        this.findAll().forEach((network) => {
            if (!Object.keys(rails).includes(network.key)) {
                changes[network.key] = [
                    {
                        type: NetworkRailsChangesType.RemovedNetwork,
                        value: network.name,
                    },
                ];
            }
        });

        // clean up
        Object.keys(changes).forEach((key) => {
            if (changes[key].length === 0) {
                delete changes[key];
            }
        });

        return changes;
    };

    applyNetworkChanges = async (rails: XamanBackend.NetworkRailsResponse, changes: NetworkRailsChanges) => {
        for (const networkKey of Object.keys(rails)) {
            if (!Object.keys(changes).includes(networkKey)) {
                // nothing changed for this network
                continue;
            }

            // craft the new network object
            const networkObject: Partial<NetworkModel> = {
                key: networkKey,
                name: rails[networkKey].name,
                networkId: rails[networkKey].chain_id,
                type: rails[networkKey].is_livenet ? NetworkType.Main : NetworkType.Test,
                nativeAsset: {
                    asset: rails[networkKey].native_asset,
                    icon: rails[networkKey].icons.icon_asset,
                    iconSquare: rails[networkKey].icons.icon_square,
                },
                color: rails[networkKey].color,
                updatedAt: new Date(),
            };

            // check if we need to update the network or add it
            const localNetwork = this.findOne({ key: networkKey });

            // generate new id or assign current local network
            if (localNetwork) {
                Object.assign(networkObject, { id: localNetwork.id });
            } else {
                Object.assign(networkObject, { id: new Realm.BSON.ObjectId() });
            }

            // apply network changes
            const network = await this.update(networkObject);

            const nodes = [] as unknown as Realm.List<NodeModel>;

            // ADDED NODE
            for (const { url } of rails[networkKey].endpoints) {
                if (!network.nodes.find((node) => node.endpoint === url)) {
                    nodes.push(
                        await NodeRepository.create({
                            id: new Realm.BSON.ObjectId(),
                            endpoint: url,
                            registerAt: new Date(),
                            updatedAt: new Date(),
                        }),
                    );
                }
            }

            // REMOVED NODE
            for (const node of network.nodes) {
                if (!rails[networkKey].endpoints.find((endpoint) => endpoint.url === node.endpoint)) {
                    await NodeRepository.delete(node);
                } else {
                    nodes.push(node);
                }
            }

            // apply new nodes list
            await this.update({
                id: network.id,
                nodes,
            });

            // check if we removed the default node for this network
            if (!network.defaultNode || !network.defaultNode.isValid()) {
                // update the default node
                await this.update({
                    id: network.id,
                    defaultNode: nodes[0],
                });
            }
        }

        // REMOVED NETWORKS
        this.findAll().forEach((network) => {
            if (!Object.keys(rails).includes(network.key)) {
                this.delete(network);
            }
        });

        return true;
    };
}

export default new NetworkRepository();
