import has from 'lodash/has';
import Realm from 'realm';

import { TrustLineModel } from '@store/models';

import BaseRepository from './base';

/* Events  ==================================================================== */
export type TrustLineRepositoryEvent = {
    trustLineUpdate: (trustLine: TrustLineModel, changes: Partial<TrustLineModel>) => void;
};

declare interface TrustLineRepository {
    on<U extends keyof TrustLineRepositoryEvent>(event: U, listener: TrustLineRepositoryEvent[U]): this;
    off<U extends keyof TrustLineRepositoryEvent>(event: U, listener: TrustLineRepositoryEvent[U]): this;
    emit<U extends keyof TrustLineRepositoryEvent>(event: U, ...args: Parameters<TrustLineRepositoryEvent[U]>): boolean;
}

/* Repository  ==================================================================== */
class TrustLineRepository extends BaseRepository<TrustLineModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = TrustLineModel;
    }

    update = async (object: Partial<TrustLineModel>): Promise<TrustLineModel> => {
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
