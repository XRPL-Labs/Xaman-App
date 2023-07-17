import Realm, { Results } from 'realm';
import { has } from 'lodash';

import { NodeModel } from '@store/models';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class NodeRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = NodeModel.schema;
    }

    add = (node: Partial<NodeModel>) => {
        // check if node is already exist
        const exist = !this.query({ endpoint: node.endpoint }).isEmpty();

        // if not exist add it to the store
        if (!exist) {
            this.create(node);
        }
    };

    getNodes = (): Results<NodeModel> => {
        return this.findAll();
    };

    update = (object: Partial<NodeModel>) => {
        // the primary key should be in the object
        if (!has(object, this.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };
}

export default new NodeRepository();
