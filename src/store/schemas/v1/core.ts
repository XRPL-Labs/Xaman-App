import Realm from 'realm';
import { AppConfig } from '@common/constants';
import { BiometryType } from '@store/types';

/**
 * App Core Schema
 */
class Core extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false }, // user initialized the app
            passcode: 'string?', // encrypted passcode
            minutesAutoLock: { type: 'int', default: 1 }, // auto lock time in minutes
            timePassLocked: 'int?', // time locked app in unix timestamp
            passcodeAttempts: { type: 'int', default: 0 }, // number of passcode attempts
            lastUnlocked: 'int?', // last time app unlocked in unix timestamp
            biometricMethod: 'string?', // biometric auth method
            passcodeFallback: { type: 'bool', default: false }, // fallback to passcode in case of biometric fail
            language: { type: 'string', default: AppConfig.defaultLanguage }, // default app language
            defaultNode: { type: 'string', default: __DEV__ ? AppConfig.nodes.test[0] : AppConfig.nodes.main[0] },
            showMemoAlert: { type: 'bool', default: true }, // show memo alert
        },
    };

    public initialized: boolean;
    public passcode: string;
    public timePassLocked: number;
    public minutesAutoLock: number;
    public passcodeAttempts: number;
    public lastUnlocked: number;
    public biometricMethod: BiometryType;
    public passcodeFallback: boolean;
    public language: string;
    public defaultNode: string;
    public showMemoAlert: boolean;

    constructor(obj: Partial<Core>) {
        super();
        Object.assign(this, obj);
    }
}

export default Core;
