import Realm from 'realm';
import { values } from 'lodash';

// eslint-disable-next-line import/no-unresolved
import NetworksConfig from '@constants/network';

import * as models from '../../models';
import { populateDataStore } from '../../models/schemas/populate';

import { NetworkRepository } from '../../repositories';
import { NetworkRailsChangesType, NetworkType } from '../../types';

const defaultResponse = {} as any;
for (const value of NetworksConfig.networks) {
    defaultResponse[value.key] = {
        chain_id: value.networkId,
        color: value.color,
        name: value.name,
        is_livenet: value.type === NetworkType.Main,
        native_asset: value.nativeAsset.asset,
        endpoints: value.nodes.map((node: string) => {
            return { name: 'Node', url: node };
        }),
        icons: { icon_square: value.nativeAsset.iconSquare, icon_asset: value.nativeAsset.icon },
    };
}

describe('NetworkRepository', () => {
    let realm: Realm;

    beforeAll(async () => {
        // get realm instance
        realm = new Realm({ schema: values(models), path: './.jest/realmInMemory', inMemory: true });

        const repositories = require('../../repositories');
        Object.keys(repositories).forEach((key) => {
            const repository = repositories[key];
            if (typeof repository.initialize === 'function') {
                repository.initialize(realm);
            }
        });
    });

    beforeEach(() => {
        // clean up the store
        realm.write(() => {
            realm.deleteAll();
        });

        // populate dataStore
        populateDataStore(realm);
    });

    describe('get and apply network rail changes', () => {
        it('should detect a newly added network & apply changes', async () => {
            const railsResponse = {
                ...defaultResponse,
                ...{
                    MYNETWORK: {
                        chain_id: 21338,
                        color: '#000000',
                        name: 'new network',
                        is_livenet: false,
                        native_asset: 'ABC',
                        endpoints: [{ name: 'my node', url: 'wss://node.com' }],
                        icons: { icon_square: 'data:base64', icon_asset: 'data:base64' },
                    },
                },
            };
            const changes = NetworkRepository.getNetworkChanges(railsResponse);
            expect(changes.MYNETWORK.length).toEqual(2);
            expect(changes.MYNETWORK).toContainEqual({
                type: NetworkRailsChangesType.AddedNetwork,
                value: 'new network',
            });
            expect(changes.MYNETWORK).toContainEqual({
                type: NetworkRailsChangesType.AddedNode,
                value: 'wss://node.com',
            });

            // apply changes
            await NetworkRepository.applyNetworkChanges(railsResponse, changes);

            // get the new network object
            const newNetwork = NetworkRepository.findOne({ key: 'MYNETWORK' });

            expect(newNetwork.networkId).toBe(railsResponse.MYNETWORK.chain_id);
            expect(newNetwork.color).toBe(railsResponse.MYNETWORK.color);
            expect(newNetwork.name).toBe(railsResponse.MYNETWORK.name);
            expect(newNetwork.type).toBe(NetworkType.Test);
            expect(newNetwork.nativeAsset.asset).toBe(railsResponse.MYNETWORK.native_asset);
            expect(newNetwork.nativeAsset.icon).toBe(railsResponse.MYNETWORK.icons.icon_asset);
            expect(newNetwork.nativeAsset.iconSquare).toBe(railsResponse.MYNETWORK.icons.icon_square);
            expect(newNetwork.nodes.length).toBe(1);
            expect(newNetwork.defaultNode).toBeDefined();
            expect(newNetwork.defaultNode.endpoint).toBe('wss://node.com');
        });

        it('should detect an added node  & apply changes', async () => {
            expect(NetworkRepository.findOne({ key: 'XAHAU' }).nodes.length).toBe(1);

            const railsResponse = {
                ...defaultResponse,
                ...{
                    XAHAU: {
                        ...defaultResponse.XAHAU,
                        endpoints: [
                            { name: 'Xahau Nodes', url: 'wss://xahau.network' },
                            { name: 'Xahau Nodes 2', url: 'wss://xahau-node-backup.network' },
                        ],
                    },
                },
            };

            const changes = NetworkRepository.getNetworkChanges(railsResponse);

            expect(changes.XAHAU.length).toEqual(1);
            expect(changes.XAHAU).toContainEqual({
                type: NetworkRailsChangesType.AddedNode,
                value: 'wss://xahau-node-backup.network',
            });

            // apply changes
            await NetworkRepository.applyNetworkChanges(railsResponse, changes);

            const network = NetworkRepository.findOne({ key: 'XAHAU' });

            expect(network.nodes.length).toBe(2);
            expect(network.nodes.find((n) => n.endpoint === 'wss://xahau-node-backup.network')).toBeDefined();
            expect(network.defaultNode.endpoint).toBe('wss://xahau.network');
        });

        it('should detect a removed node & apply changes', async () => {
            expect(NetworkRepository.findOne({ key: 'TESTNET' }).nodes.length).toBe(2);

            const railsResponse = {
                ...defaultResponse,
                ...{
                    TESTNET: {
                        ...defaultResponse.TESTNET,
                        endpoints: [{ name: '', url: 'wss://s.altnet.rippletest.net:51233' }],
                    },
                },
            };

            const changes = NetworkRepository.getNetworkChanges(railsResponse);

            expect(changes.TESTNET.length).toEqual(1);
            expect(changes.TESTNET).toContainEqual({
                type: NetworkRailsChangesType.RemovedNode,
                value: 'wss://testnet.xrpl-labs.com',
            });

            // apply changes
            await NetworkRepository.applyNetworkChanges(railsResponse, changes);

            const network = NetworkRepository.findOne({ key: 'TESTNET' });

            expect(network.nodes.length).toBe(1);
            expect(network.nodes.find((n) => n.endpoint === 'wss://testnet.xrpl-labs.com')).toBeUndefined();
            expect(network.defaultNode.endpoint).toBe('wss://s.altnet.rippletest.net:51233');
        });

        it('should detect a changed property & apply', async () => {
            const railsResponse = {
                ...defaultResponse,
                ...{
                    XAHAU: {
                        ...defaultResponse.XAHAU,
                        color: '#FFFFF',
                        name: 'Xahau Mainnet',
                    },
                },
            };

            const changes = NetworkRepository.getNetworkChanges(railsResponse);

            expect(changes.XAHAU.length).toEqual(2);
            expect(changes.XAHAU).toContainEqual({
                type: NetworkRailsChangesType.ChangedProperty,
                value: 'Name',
            });
            expect(changes.XAHAU).toContainEqual({
                type: NetworkRailsChangesType.ChangedProperty,
                value: 'Color',
            });

            // apply changes
            await NetworkRepository.applyNetworkChanges(railsResponse, changes);

            const network = NetworkRepository.findOne({ key: 'XAHAU' });

            expect(network.name).toBe('Xahau Mainnet');
            expect(network.color).toBe('#FFFFF');
        });

        it('should detect a removed network', async () => {
            expect(NetworkRepository.findOne({ key: 'XAHAUTESTNET' })).toBeDefined();

            const railsResponse = {
                ...(delete defaultResponse.XAHAUTESTNET && defaultResponse),
            };

            const changes = NetworkRepository.getNetworkChanges(railsResponse);

            expect(changes.XAHAUTESTNET.length).toEqual(1);
            expect(changes.XAHAUTESTNET).toContainEqual({
                type: NetworkRailsChangesType.RemovedNetwork,
                value: 'Xahau Testnet',
            });

            // apply changes
            await NetworkRepository.applyNetworkChanges(railsResponse, changes);

            expect(NetworkRepository.findOne({ key: 'XAHAUTESTNET' })).toBeUndefined();
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        realm.close();
        Realm.deleteFile({ path: './.jest/realmInMemory' });
    });
});
