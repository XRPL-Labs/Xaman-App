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
    public declare initialized: boolean;
    /** hashed passcode. */
    public declare passcode?: string;
    /** Minutes after which auto-locking should occur. */
    public declare minutesAutoLock: number;
    /** Timestamp of the last failed passcode attempt. */
    public declare lastPasscodeFailedTimestamp?: number;
    /** Number of failed passcode attempts. */
    public declare passcodeFailedAttempts: number;
    /** Timestamp of the last successful unlock event. */
    public declare lastUnlockedTimestamp?: number;
    /** Flag to indicate whether to purge data on brute force attempts. */
    public declare purgeOnBruteForce: boolean;
    /** Type of biometric method used, if any. */
    public declare biometricMethod: BiometryType;
    /** Indicates if fallback to passcode is allowed. */
    public declare passcodeFallback: boolean;
    /** Selected language for the application. */
    public declare language: string;
    /** Selected currency for the application. */
    public declare currency: string;
    /** Selected network for the application. */
    public declare network: NetworkModel;
    /** Default account for the application. */
    public declare account: any;
    /** Indicates whether haptic feedback is enabled. */
    public declare hapticFeedback: boolean;
    /** Indicates whether advisoryTransasctions are to be hidden. */
    public declare hideAdvisoryTransactions: boolean;
    /** Indicates whether serviceFees are to be hidden. */
    public declare hideServiceFeeTransactions: boolean;
    /** Indicates whether discreet mode is enabled. */
    public declare discreetMode: boolean;
    /** Indicates whether the reserve panel should be displayed in home screen. */
    public declare showReservePanel: boolean;
    /** Indicates if system separators should be used. */
    public declare useSystemSeparators: boolean;
    /** Indicates if developer mode is enabled. */
    public declare developerMode: boolean;
    /** Selected theme for the application. */
    public declare theme: Themes;
    /** Auto switching. */
    public declare themeAutoSwitch: boolean;
}

export default Core;
