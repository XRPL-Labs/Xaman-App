import Realm, { ObjectSchema } from 'realm';
import has from 'lodash/has';

import { TrustLineSchema } from '@store/schemas/latest';
import BaseRepository from './base';

declare interface TrustLineRepository {
    on(
        event: 'trustLineUpdate',
        listener: (trustLine: TrustLineSchema, changes: Partial<TrustLineSchema>) => void,
    ): this;
}

class TrustLineRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = TrustLineSchema.schema;
    }

    update = (object: Partial<TrustLineSchema>) => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true).then((updatedTrustLine: TrustLineSchema) => {
            this.emit('trustLineUpdate', updatedTrustLine, object);
            return updatedTrustLine;
        });
    };
}

export default new TrustLineRepository();
