import Realm from 'realm';
import { has } from 'lodash';

import NodeModel from '@store/models/objects/node';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class NodeRepository extends BaseRepository<NodeModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = NodeModel;
    }

    add = (node: Partial<NodeModel>) => {
        // check if node is already exist
        const exist = !this.query({ endpoint: node.endpoint }).isEmpty();

        // if not exist add it to the store
        if (!exist) {
            return this.create(node);
        }

        return undefined;
    };

    getNodes = () => {
        return this.findAll();
    };

    update = (object: Partial<NodeModel>) => {
        // the primary key should be in the object
        if (this.model.schema?.primaryKey && !has(object, this.model.schema.primaryKey)) {
            throw new Error(`Update require primary key (${this.model.schema.primaryKey}) to be set`);
        }
        return this.create(object, true);
    };
}

export default new NodeRepository();
