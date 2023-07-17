/**
 * Profile Schema v1
 */

/* Schema  ==================================================================== */
const ProfileSchema = {
    schema: {
        name: 'Profile',
        properties: {
            username: 'string?',
            slug: 'string?',
            uuid: 'string?',
            signedTOSVersion: 'int?',
            signedTOSDate: 'date?',
            accessToken: 'string?',
            idempotency: { type: 'int', default: 0 },
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    },
};

export default ProfileSchema;
