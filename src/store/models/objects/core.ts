/**
 * Core model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { BiometryType, Themes } from '@store/types';
import { CoreSchema } from '@store/models/schemas/latest';

import NetworkModel from '@store/models/objects/network';
/* Model  ==================================================================== */
class Core extends Realm.Object<Core> {
    public static schema: Realm.ObjectSchema = CoreSchema.schema;

    /** Indicates whether the app has been initialized. */
    public initialized: boolean;
    /** hashed passcode. */
    public passcode?: string;
    /** Minutes after which auto-locking should occur. */
    public minutesAutoLock: number;
    /** Timestamp of the last failed passcode attempt. */
    public lastPasscodeFailedTimestamp?: number;
    /** Number of failed passcode attempts. */
    public passcodeFailedAttempts: number;
    /** Timestamp of the last successful unlock event. */
    public lastUnlockedTimestamp?: number;
    /** Flag to indicate whether to purge data on brute force attempts. */
    public purgeOnBruteForce: boolean;
    /** Type of biometric method used, if any. */
    public biometricMethod?: BiometryType;
    /** Indicates if fallback to passcode is allowed. */
    public passcodeFallback: boolean;
    /** Selected language for the application. */
    public language: string;
    /** Selected currency for the application. */
    public currency: string;
    /** Selected network for the application. */
    public network: NetworkModel;
    /** Default account for the application. */
    public account: any;
    /** Indicates whether haptic feedback is enabled. */
    public hapticFeedback: boolean;
    /** Indicates whether discreet mode is enabled. */
    public discreetMode: boolean;
    /** Indicates whether the reserve panel should be displayed in home screen. */
    public showReservePanel: boolean;
    /** Indicates if system separators should be used. */
    public useSystemSeparators: boolean;
    /** Indicates if developer mode is enabled. */
    public developerMode: boolean;
    /** Selected theme for the application. */
    public theme: Themes;
}

export default Core;
