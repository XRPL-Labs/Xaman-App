import Realm, { ObjectSchema } from 'realm';
import { assign, has } from 'lodash';

import { CurrencySchema } from '@store/schemas/latest';

import BaseRepository from './base';

class CurrencyRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CurrencySchema.schema;
    }

    include = (data: any): Promise<any> => {
        // assign id if not applied
        if (!has(data, 'id')) {
            assign(data, { id: `${data.issuer}.${data.currency}` });
        }
        return this.upsert(data);
    };

    update = (object: CurrencySchema) => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key to be set');
        }
        this.create(object, true);
    };
}

export default new CurrencyRepository();
