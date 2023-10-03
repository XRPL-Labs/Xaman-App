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
class ProfileRepository extends BaseRepository<ProfileModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = ProfileModel;
    }

    updateIdempotency = (idempotency: number) => {
        const profile = this.getProfile();
        this.safeWrite(() => {
            profile.idempotency = idempotency;
        });
    };

    saveProfile = (object: Partial<ProfileModel>): Promise<ProfileModel> => {
        return new Promise((resolve, reject) => {
            const current = this.getProfile();

            if (current) {
                this.safeWrite(() => {
                    assign(current, object);
                    resolve(current);
                });
            } else {
                this.create(object).then(resolve).catch(reject);
            }

            // send the event
            this.emit('profileUpdate', object);
        });
    };

    getProfile = (): ProfileModel => {
        const profiles = this.findAll();

        // get profile
        if (profiles.length > 0) {
            return profiles[0];
        }

        return undefined;
    };
}

export default new ProfileRepository();
