import Realm, { ObjectSchema } from 'realm';
import has from 'lodash/has';

import { CurrencySchema } from '@store/schemas/latest';

import BaseRepository from './base';

class CurrencyRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CurrencySchema.schema;
    }

    update = (object: CurrencySchema) => {
        // the primary key should be in the object
        if (!has(object, 'issuer')) {
            throw new Error('Update require primary key to be set');
        }
        this.create(object, true);
    };
}

export default new CurrencyRepository();
