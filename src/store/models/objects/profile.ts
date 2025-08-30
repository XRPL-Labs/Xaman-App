/**
 *  Profile Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { ProfileSchema } from '@store/models/schemas/latest';
import { MonetizationStatus } from '@store/types';

/* Dictionary  ==================================================================== */
interface Monetization {
    monetizationStatus: MonetizationStatus;
    productForPurchase?: string;
    monetizationType?: string;
}

/* Model  ==================================================================== */
class Profile extends Realm.Object<Profile> {
    public static schema: Realm.ObjectSchema = ProfileSchema.schema;

    /** Display name or identifier chosen by the user. */
    public declare username: string;
    /** URL-friendly version of the username, often used for profile URLs. */
    public declare slug: string;
    /** Unique identifier representing this specific user profile. */
    public declare uuid: string;
    /** Unique identifier for the user's device. */
    public declare swapNetworks: string;
    /** Unique identifier for the user's device. */
    public declare deviceUUID: string;
    /** Version number of the Terms of Service the user agreed to. */
    public declare signedTOSVersion: number;
    /** Date when the user accepted the current Terms of Service. */
    public declare signedTOSDate: Date;
    /** Token used to authenticate the user for API calls. */
    public declare accessToken: string;
    /** Token used to refresh the access token once it expires. */
    public declare refreshToken: string;
    /** Hash value associated with the bearer token for security checks. */
    public declare bearerHash: string;
    /** Unique number generated for ensuring idempotent requests. */
    public declare idempotency: number;
    /** Indicates if the user has a Pro membership. */
    public declare hasPro: boolean;
    /** Info about monetization for the current user. */
    public declare monetization: Monetization;
    /** Date when the user initially registered their profile. */
    public declare registerAt: Date;
    /** Date when the user's profile data was last synchronized with the backend. */
    public declare lastSync: Date;
}

export default Profile;
