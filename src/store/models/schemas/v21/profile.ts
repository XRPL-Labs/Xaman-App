/**
 * Profile Schema v21
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const ProfileSchema = {
    schema: {
        name: 'Profile',
        properties: {
            username: { type: 'string', optional: true },
            slug: { type: 'string', optional: true },
            uuid: { type: 'string', optional: true },
            deviceUUID: { type: 'string', optional: true },
            swapNetworks: { type: 'string', optional: true },
            signedTOSVersion: { type: 'int', optional: true },
            signedTOSDate: { type: 'date', optional: true },
            accessToken: { type: 'string', optional: true },
            refreshToken: { type: 'string', optional: true },
            bearerHash: { type: 'string', optional: true },
            idempotency: { type: 'int', default: 0 },
            hasPro: { type: 'bool', default: false },
            monetization: { type: 'dictionary', objectType: 'string' },
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Profile schema to 21');

        const newObjects = newRealm.objects(ProfileSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].swapNetworks = '';
        }
    },
};

export default <ExtendedSchemaType>ProfileSchema;
