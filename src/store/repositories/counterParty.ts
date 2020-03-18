import Realm, { ObjectSchema } from 'realm';
import has from 'lodash/has';

import { CounterPartySchema } from '@store/schemas/latest';

import BaseRepository from './base';

class CounterPartyRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CounterPartySchema.schema;
    }

    update = (object: CounterPartySchema) => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key to be set');
        }
        this.create(object, true);
    };
}

export default new CounterPartyRepository();
