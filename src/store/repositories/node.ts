import Realm, { ObjectSchema, Results } from 'realm';
import { has } from 'lodash';

import { NodeSchema } from '@store/schemas/latest';

import BaseRepository from './base';

/* repository  ==================================================================== */
class NodeRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = NodeSchema.schema;
    }

    add = (node: Partial<NodeSchema>) => {
        // check if node is already exist
        const exist = !this.query({ endpoint: node.endpoint }).isEmpty();

        // if not exist add it to the store
        if (!exist) {
            this.create(node);
        }
    };

    getNodes = (): Results<NodeSchema> => {
        return this.findAll();
    };

    update = (object: Partial<NodeSchema>) => {
        // the primary key should be in the object
        if (!has(object, 'endpoint')) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };
}

export default new NodeRepository();
