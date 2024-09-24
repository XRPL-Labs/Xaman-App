import { values } from 'lodash';

import Realm from 'realm';

// eslint-disable-next-line import/no-unresolved
import NetworkConfig from '@common/constants/network';

import * as models from '../../models';

import { populateDataStore, populateCore, populateNetworks, populateNodes } from '../../models/schemas/populate';

describe('Populate', () => {
    let instance: Realm;

    beforeAll(async () => {
        // get realm instance
        instance = new Realm({ schema: values(models), path: './.jest/realmInMemory', inMemory: true });
    });

    it('should be able to populate networks', () => {
        jest.spyOn(instance, 'create');

        // call the populateNetworks
        instance.write(() => {
            populateNetworks(instance);
        });

        expect(instance.create).toBeCalledTimes(NetworkConfig.networks.length);
        expect(instance.create).toBeCalledWith(models.NetworkModel.schema.name, expect.any(Object));
    });

    it('should be able to populate nodes', () => {
        jest.spyOn(instance, 'create');

        // call the populateNodes
        instance.write(() => {
            populateNodes(instance);
        });

        expect(instance.create).toBeCalledWith(models.NodeModel.schema.name, expect.any(Object));

        // should be able to assign created nodes to the networks nodes and default nodes
        const networks = instance.objects<models.NetworkModel>(models.NetworkModel.schema.name);

        // verify we already have network objects
        expect(networks.length).toBeGreaterThan(0);

        for (const network of networks) {
            expect(network.nodes.length).toBeGreaterThan(0);
            expect(network.defaultNode).toBeDefined();
            expect(network.defaultNode).toBeInstanceOf(models.NodeModel);
        }
    });

    it('should be able to populate core', () => {
        jest.spyOn(instance, 'create');

        // call the populateCore
        instance.write(() => {
            populateCore(instance);
        });

        expect(instance.create).toBeCalledWith(models.CoreModel.schema.name, expect.any(Object));

        const coreObject = instance.objects<models.CoreModel>(models.CoreModel.schema.name)[0];

        // make sure the core object is created
        expect(coreObject).toBeDefined();

        // verify coreObject network has been defined and also default network from NetworkConfig has been set
        expect(coreObject.network).toBeDefined();
        expect(coreObject.network).toBeInstanceOf(models.NetworkModel);
        expect(coreObject.network.networkId).toBe(NetworkConfig.defaultNetworkId);
    });

    it('should call functions in correct order', () => {
        const populateNetworksMock = jest.spyOn(require('../../models/schemas/populate'), 'populateNetworks');
        const populateNodesMock = jest.spyOn(require('../../models/schemas/populate'), 'populateNodes');
        const populateCoreMock = jest.spyOn(require('../../models/schemas/populate'), 'populateCore');

        // call populateDataStore
        populateDataStore(instance);

        expect(
            populateNetworksMock.mock.invocationCallOrder[0] <= populateNodesMock.mock.invocationCallOrder[0] &&
                populateNodesMock.mock.invocationCallOrder[0] <= populateCoreMock.mock.invocationCallOrder[0],
        ).toBe(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        instance.close();
        Realm.deleteFile({ path: './.jest/realmInMemory' });
    });
});
