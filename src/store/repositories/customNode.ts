import Realm, { ObjectSchema, Results } from 'realm';
import has from 'lodash/has';

import Localize from '@locale';

import { CustomNodeSchema } from '@store/schemas/latest';
import BaseRepository from './base';

class CustomNodeRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CustomNodeSchema.schema;
    }

    add = (node: Partial<CustomNodeSchema>) => {
        // check if node is already exist
        const exist = !this.query({ endpoint: node.endpoint }).isEmpty();

        // if not exist add it to the store
        if (!exist) {
            this.create(node);
        }
    };

    getNodeExplorer = (node: string) => {
        const customNode = this.findOne({ endpoint: node }) as CustomNodeSchema;

        if (customNode) {
            return {
                title: Localize.t('global.explorer'),
                tx: customNode.explorerTx,
                account: customNode.explorerAccount,
            };
        }

        return undefined;
    };

    getNodes = (): Results<CustomNodeSchema> => {
        return this.findAll();
    };

    update = (object: Partial<CustomNodeSchema>) => {
        // the primary key should be in the object
        if (!has(object, 'endpoint')) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };
}

export default new CustomNodeRepository();
