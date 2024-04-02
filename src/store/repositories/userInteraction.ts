import Realm from 'realm';

import { UserInteractionModel } from '@store/models';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class UserInteractionRepository extends BaseRepository<UserInteractionModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = UserInteractionModel;
    }
}

export default new UserInteractionRepository();
