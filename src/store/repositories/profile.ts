import Realm, { ObjectSchema } from 'realm';
import assign from 'lodash/assign';

import { ProfileSchema } from '@store/schemas/latest';

import BaseRepository from './base';

// events
declare interface ProfileRepository {
    on(event: 'profileUpdate', listener: (changes: Partial<ProfileSchema>) => void): this;
    on(event: string, listener: Function): this;
}

class ProfileRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = ProfileSchema.schema;
    }

    updateIdempotency = (idempotency: number) => {
        const profile = this.getProfile();
        this.safeWrite(() => {
            profile.idempotency = idempotency;
        });
    };

    saveProfile = (object: Partial<ProfileSchema>) => {
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

    getProfile = (): ProfileSchema => {
        const profile = Array.from(this.findAll()) as ProfileSchema[];

        // get profile
        if (profile.length > 0) {
            return profile[0];
        }

        return undefined;
    };
}

export default new ProfileRepository();
