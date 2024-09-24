import has from 'lodash/has';
import Realm from 'realm';

import { CounterPartyModel } from '@store/models';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class CounterPartyRepository extends BaseRepository<CounterPartyModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = CounterPartyModel;
    }

    update = (object: CounterPartyModel) => {
        // the primary key should be in the object
        if (this.model.schema?.primaryKey && !has(object, this.model.schema.primaryKey)) {
            throw new Error(`Update require primary key ${this.model.schema?.primaryKey} to be set`);
        }
        return this.create(object, true);
    };
}

export default new CounterPartyRepository();
