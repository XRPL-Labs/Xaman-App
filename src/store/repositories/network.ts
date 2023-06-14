import Realm, { ObjectSchema, Results } from 'realm';
import { has } from 'lodash';

import { NetworkSchema } from '@store/schemas/latest';

import BaseRepository from './base';

/* repository  ==================================================================== */
class NetworkRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = NetworkSchema.schema;
    }

    add = (network: Partial<NetworkSchema>) => {
        // check if network is already exist
        const exist = !this.query({ endpoint: network.networkId }).isEmpty();

        // if not exist add it to the store
        if (!exist) {
            this.create(network);
        }
    };

    getNetworks = (filters?: Partial<NetworkSchema>): Results<NetworkSchema> => {
        if (filters) {
            return this.query(filters);
        }
        return this.findAll();
    };

    update = (object: Partial<NetworkSchema>) => {
        // the primary key should be in the object
        if (!has(object, 'networkId')) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };

    exist = (networkId: number): boolean => {
        return !this.query({ networkId }).isEmpty();
    };
}

export default new NetworkRepository();
