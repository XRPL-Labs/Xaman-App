import Realm from 'realm';

/**
 * XUMM Profile Model
 */
// @ts-ignore
class Profile extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Profile',
        properties: {
            username: 'string?', //  username
            slug: 'string?', // slug
            uuid: 'string?', // uuid
            deviceUUID: 'string?', // device uuid
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
    public deviceUUID: string;
    public signedTOSVersion: number;
    public signedTOSDate: Date;
    public accessToken: string;
    public idempotency: number;
    public registerAt?: Date;
    public lastSync?: Date;

    constructor(obj: Partial<Profile>) {
        super();
        Object.assign(this, obj);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Profile model to v4');

        const newObjects = newRealm.objects('Profile') as Profile[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].deviceUUID = '';
        }
    }
}

export default Profile;
