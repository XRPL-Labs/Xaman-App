/**
 * Profile Schema v4
 */

import Realm from 'realm';

/* Schema  ==================================================================== */
const ProfileSchema = {
    schema: {
        name: 'Profile',
        properties: {
            username: { type: 'string', optional: true },
            slug: { type: 'string', optional: true },
            uuid: { type: 'string', optional: true },
            deviceUUID: { type: 'string', optional: true },
            signedTOSVersion: { type: 'int', optional: true },
            signedTOSDate: { type: 'date', optional: true },
            accessToken: { type: 'string', optional: true },
            idempotency: { type: 'int', default: 0 },
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Profile schema to v4');

        const newObjects = newRealm.objects(ProfileSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].deviceUUID = '';
        }
    },
};

export default ProfileSchema;
