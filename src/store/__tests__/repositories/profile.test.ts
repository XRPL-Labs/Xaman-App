import Realm from 'realm';
import { values } from 'lodash';

import * as models from '../../models';
import { ProfileRepository } from '../../repositories';

describe('ProfileRepository', () => {
    let realm: Realm;

    beforeAll(() => {
        realm = new Realm({ schema: values(models), path: './.jest/realmProfile', inMemory: true });
        ProfileRepository.initialize(realm);
    });

    beforeEach(() => {
        realm.write(() => {
            realm.deleteAll();
        });
    });

    afterAll(() => {
        realm.close();
    });

    it('getProfile returns undefined when no profile exists', () => {
        expect(ProfileRepository.getProfile()).toBeUndefined();
    });

    it('requireProfile throws when no profile exists', () => {
        expect(() => ProfileRepository.requireProfile()).toThrow('Profile is missing');
    });

    it('requireProfile returns the saved profile', async () => {
        const saved = await ProfileRepository.saveProfile({
            uuid: 'user-uuid',
            deviceUUID: 'device-uuid',
            accessToken: 'token',
        });

        const required = ProfileRepository.requireProfile();
        expect(required.uuid).toEqual(saved.uuid);
        expect(required.deviceUUID).toEqual('device-uuid');
    });
});
