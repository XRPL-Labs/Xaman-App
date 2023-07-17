/**
 *  Profile Model
 */

import Realm from 'realm';

import { ProfileSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Profile extends Realm.Object<Profile> {
    public static schema: Realm.ObjectSchema = ProfileSchema.schema;

    public username: string;
    public slug: string;
    public uuid: string;
    public deviceUUID: string;
    public signedTOSVersion: number;
    public signedTOSDate: Date;
    public accessToken: string;
    public refreshToken: string;
    public bearerHash: string;
    public idempotency: number;
    public registerAt?: Date;
    public lastSync?: Date;
    public hasPro?: boolean;
}

export default Profile;
