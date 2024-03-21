import Realm from 'realm';
import assign from 'lodash/assign';

import { ProfileModel } from '@store/models';

import BaseRepository from './base';

/* Events  ==================================================================== */
export type ProfileRepositoryEvent = {
    profileUpdate: (profile: ProfileModel, changes: Partial<ProfileModel>) => void;
};

declare interface ProfileRepository {
    on<U extends keyof ProfileRepositoryEvent>(event: U, listener: ProfileRepositoryEvent[U]): this;
    off<U extends keyof ProfileRepositoryEvent>(event: U, listener: ProfileRepositoryEvent[U]): this;
    emit<U extends keyof ProfileRepositoryEvent>(event: U, ...args: Parameters<ProfileRepositoryEvent[U]>): boolean;
}

/* Repository  ==================================================================== */
class ProfileRepository extends BaseRepository<ProfileModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = ProfileModel;
    }

    updateIdempotency = (idempotency: number) => {
        const profile = this.getProfile();

        if (profile) {
            this.safeWrite(() => {
                profile.idempotency = idempotency;
            });
        }
    };

    saveProfile = (object: Partial<ProfileModel>): Promise<ProfileModel> => {
        return new Promise((resolve, reject) => {
            const current = this.getProfile();

            if (current) {
                this.safeWrite(() => {
                    assign(current, object);
                    this.emit('profileUpdate', current, object);
                    resolve(current);
                });
            } else {
                this.create(object)
                    .then((createdProfile: ProfileModel) => {
                        this.emit('profileUpdate', createdProfile, object);
                        resolve(createdProfile);
                    })
                    .catch(reject);
            }
        });
    };

    getProfile = (): ProfileModel | undefined => {
        const profiles = this.findAll();

        // get profile
        if (profiles.length > 0) {
            return profiles[0];
        }

        return undefined;
    };
}

export default new ProfileRepository();
