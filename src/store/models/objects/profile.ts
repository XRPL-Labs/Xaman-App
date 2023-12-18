/**
 *  Profile Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { ProfileSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Profile extends Realm.Object<Profile> {
    public static schema: Realm.ObjectSchema = ProfileSchema.schema;

    /** Display name or identifier chosen by the user. */
    public username: string;
    /** URL-friendly version of the username, often used for profile URLs. */
    public slug: string;
    /** Unique identifier representing this specific user profile. */
    public uuid: string;
    /** Unique identifier for the user's device. */
    public deviceUUID: string;
    /** Version number of the Terms of Service the user agreed to. */
    public signedTOSVersion: number;
    /** Date when the user accepted the current Terms of Service. */
    public signedTOSDate: Date;
    /** Token used to authenticate the user for API calls. */
    public accessToken: string;
    /** Token used to refresh the access token once it expires. */
    public refreshToken: string;
    /** Hash value associated with the bearer token for security checks. */
    public bearerHash: string;
    /** Unique number generated for ensuring idempotent requests. */
    public idempotency: number;
    /** Date when the user initially registered their profile. */
    public registerAt?: Date;
    /** Date when the user's profile data was last synchronized with the backend. */
    public lastSync?: Date;
    /** Indicates if the user has a Pro membership or subscription. */
    public hasPro?: boolean;
}

export default Profile;
