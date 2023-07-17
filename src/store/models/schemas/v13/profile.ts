/**
 * Profile Schema v13
 */

/* Schema  ==================================================================== */
const ProfileSchema = {
    schema: {
        name: 'Profile',
        properties: {
            username: 'string?',
            slug: 'string?',
            uuid: 'string?',
            deviceUUID: 'string?',
            signedTOSVersion: 'int?',
            signedTOSDate: 'date?',
            accessToken: 'string?',
            refreshToken: 'string?',
            bearerHash: 'string?',
            idempotency: { type: 'int', default: 0 },
            hasPro: { type: 'bool', default: false },
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Profile schema to 13');

        const newObjects = newRealm.objects(ProfileSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].refreshToken = undefined;
            newObjects[i].bearerHash = undefined;
        }
    },
};

export default ProfileSchema;
