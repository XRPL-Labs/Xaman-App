import Realm from 'realm';
import { AppConfig } from '@common/constants';
import { BiometryType } from '@store/types';

/**
 * App Core Schema
 */
// @ts-ignore
class Core extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false }, // user initialized the app
            passcode: 'string?', // encrypted passcode
            minutesAutoLock: { type: 'int', default: 1 }, // auto lock time in minutes
            lastPasscodeFailedTimestamp: 'int?', // last time when passcode failed attempt
            passcodeFailedAttempts: { type: 'int', default: 0 }, // number of passcode failed attempts
            lastUnlockedTimestamp: 'int?', // last time app unlocked
            purgeOnBruteForce: { type: 'bool', default: false }, // purge all data on many passcode failed attempt
            biometricMethod: 'string?', // biometric auth method
            passcodeFallback: { type: 'bool', default: false }, // fallback to passcode in case of biometric fail
            language: { type: 'string', default: AppConfig.language.default }, // default app language
            defaultNode: { type: 'string', default: __DEV__ ? AppConfig.nodes.test[0] : AppConfig.nodes.main[0] },
            theme: { type: 'string', default: AppConfig.theme.light }, // app theme
            showMemoAlert: { type: 'bool', default: true }, // show memo alert
        },
    };

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
    public defaultNode: string;
    public theme: string;
    public showMemoAlert: boolean;

    constructor(obj: Partial<Core>) {
        super();
        Object.assign(this, obj);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Core model to v2');

        const newObjects = newRealm.objects('Core') as Core[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].lastPasscodeFailedTimestamp = 0;
            newObjects[i].passcodeFailedAttempts = 0;
            newObjects[i].lastUnlockedTimestamp = 0;
            newObjects[i].purgeOnBruteForce = false;
            newObjects[i].theme = AppConfig.theme.light;
        }
    }
}

export default Core;
