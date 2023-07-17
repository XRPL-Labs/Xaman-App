import Realm from 'realm';
import has from 'lodash/has';

import { CounterPartyModel } from '@store/models';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class CounterPartyRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CounterPartyModel.schema;
    }

    update = (object: CounterPartyModel) => {
        // the primary key should be in the object
        if (!has(object, this.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }
        this.create(object, true);
    };
}

export default new CounterPartyRepository();
