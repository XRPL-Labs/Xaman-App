import Realm from 'realm';

/**
 * XUMM Profile Model
 */
class Profile extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Profile',
        properties: {
            username: 'string?', //  username
            slug: 'string?', // slug
            uuid: 'string?', // uuid
            signedTOSVersion: 'int?', // last signed agreement version
            signedTOSDate: 'date?', // signed agreement date
            accessToken: 'string?', // API accessToken
            idempotency: { type: 'int', default: 0 }, // API calls idempotency
            registerAt: { type: 'date', default: new Date() },
            lastSync: { type: 'date', default: new Date() },
        },
    };

    public username: string;
    public slug: string;
    public uuid: string;
    public signedTOSVersion: number;
    public signedTOSDate: Date;
    public accessToken: string;
    public idempotency: number;
    public registerAt?: Date;
    public lastSync?: Date;
}

export default Profile;
