import Realm from 'realm';
import assign from 'lodash/assign';

import { ProfileModel } from '@store/models';

import BaseRepository from './base';

/* Events  ==================================================================== */
declare interface ProfileRepository {
    on(event: 'profileUpdate', listener: (changes: Partial<ProfileModel>) => void): this;
    on(event: string, listener: Function): this;
}

/* Repository  ==================================================================== */
class ProfileRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = ProfileModel.schema;
    }

    updateIdempotency = (idempotency: number) => {
        const profile = this.getProfile();
        this.safeWrite(() => {
            profile.idempotency = idempotency;
        });
    };

    saveProfile = (object: Partial<ProfileModel>) => {
        const current = this.getProfile();
        if (current) {
            this.safeWrite(() => {
                assign(current, object);
            });
        } else {
            this.create(object);
        }

        // send the event
        this.emit('profileUpdate', object);
    };

    getProfile = (): ProfileModel => {
        const profile = Array.from(this.findAll()) as ProfileModel[];

        // get profile
        if (profile.length > 0) {
            return profile[0];
        }

        return undefined;
    };
}

export default new ProfileRepository();
