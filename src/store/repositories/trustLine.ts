import has from 'lodash/has';
import Realm from 'realm';

import { TrustLineModel } from '@store/models';

import BaseRepository from './base';

/* Events  ==================================================================== */
declare interface TrustLineRepository {
    on(event: 'trustLineUpdate', listener: (trustLine: TrustLineModel, changes: Partial<TrustLineModel>) => void): this;
}

/* Repository  ==================================================================== */
class TrustLineRepository extends BaseRepository<TrustLineModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = TrustLineModel;
    }

    update = (object: Partial<TrustLineModel>) => {
        // the primary key should be in the object
        if (!has(object, this.model.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }

        return this.create(object, true).then((updatedTrustLine: TrustLineModel) => {
            this.emit('trustLineUpdate', updatedTrustLine, object);
            return updatedTrustLine;
        });
    };
}

export default new TrustLineRepository();
