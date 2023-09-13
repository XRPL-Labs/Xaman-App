/**
 * Profile Schema v1
 */

/* Schema  ==================================================================== */
const ProfileSchema = {
    schema: {
        name: 'Profile',
        properties: {
            username: { type: 'string', optional: true },
            slug: { type: 'string', optional: true },
            uuid: { type: 'string', optional: true },
            signedTOSVersion: { type: 'int', optional: true },
            signedTOSDate: 'date?',
            accessToken: { type: 'string', optional: true },
            idempotency: { type: 'int', default: 0 },
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    },
};

export default ProfileSchema;
