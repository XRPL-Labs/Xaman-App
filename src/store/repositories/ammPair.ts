import Realm from 'realm';

import { AmmPairModel } from '@store/models';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class AmmPairRepository extends BaseRepository<AmmPairModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = AmmPairModel;
    }
}

export default new AmmPairRepository();
