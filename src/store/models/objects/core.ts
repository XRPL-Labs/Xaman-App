/**
 * App Core Model
 */

import Realm from 'realm';

import { BiometryType, Themes } from '@store/types';
import { CoreSchema } from '@store/models/schemas/latest';

import NetworkModel from '@store/models/objects/network';
/* Model  ==================================================================== */
class Core extends Realm.Object<Core> {
    public static schema: Realm.ObjectSchema = CoreSchema.schema;

    public initialized: boolean;
    public passcode: string;
    public minutesAutoLock: number;
    public lastPasscodeFailedTimestamp: number;
    public passcodeFailedAttempts: number;
    public lastUnlockedTimestamp: number;
    public purgeOnBruteForce: boolean;
    public biometricMethod: BiometryType;
    public passcodeFallback: boolean;
    public language: string;
    public currency: string;
    public network: NetworkModel;
    public account: any;
    public hapticFeedback: boolean;
    public discreetMode: boolean;
    public showReservePanel: boolean;
    public useSystemSeparators: boolean;
    public developerMode: boolean;
    public theme: Themes;
}

export default Core;
