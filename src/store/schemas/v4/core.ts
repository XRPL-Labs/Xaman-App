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
            lastPasscodeFailedTimestamp: 'int?', // last time when passcode failed attempt
            passcodeFailedAttempts: { type: 'int', default: 0 }, // number of passcode failed attempts
            lastUnlockedTimestamp: 'int?', // last time app unlocked
            purgeOnBruteForce: { type: 'bool', default: false }, // purge all data on many passcode failed attempt
            biometricMethod: 'string?', // biometric auth method
            passcodeFallback: { type: 'bool', default: false }, // fallback to passcode in case of biometric fail
            language: { type: 'string', default: AppConfig.defaultLanguage }, // default app language
            defaultNode: { type: 'string', default: __DEV__ ? AppConfig.nodes.test[0] : AppConfig.nodes.main[0] },
            defaultExplorer: { type: 'string', default: AppConfig.explorer[0].value }, // default explorer
            hapticFeedback: { type: 'bool', default: true }, // enable haptic feedback
            discreetMode: { type: 'bool', default: false }, // Discreet Mode
            theme: { type: 'string', default: AppConfig.defaultTheme }, // app theme
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
    public defaultExplorer: string;
    public hapticFeedback: boolean;
    public discreetMode: boolean;
    public theme: string;

    constructor(obj: Partial<Core>) {
        super();
        Object.assign(this, obj);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Core model to v4');

        const newObjects = newRealm.objects('Core') as Core[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].discreetMode = false;
        }
    }
}

export default Core;
