import Realm, { ObjectSchema, Results } from 'realm';
import { has, get } from 'lodash';

import Localize from '@locale';

import { AppConfig } from '@common/constants';

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

        // fallback explorer
        const fallbackExplorer = AppConfig.explorer[0];

        return {
            title: Localize.t('global.explorer'),
            tx: get(customNode, 'explorerTx', fallbackExplorer.tx.main),
            account: get(customNode, 'explorerAccount', fallbackExplorer.account.main),
        };
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
