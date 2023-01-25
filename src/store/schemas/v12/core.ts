import Realm from 'realm';
import { AppConfig } from '@common/constants';
import { BiometryType, Themes } from '@store/types';

/**
 * App Core Schema
 */
class Core extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false }, // user initialized the app
            passcode: 'string?', // hashed passcode
            minutesAutoLock: { type: 'int', default: 1 }, // auto lock time in minutes
            lastPasscodeFailedTimestamp: 'int?', // last time when passcode failed attempt
            passcodeFailedAttempts: { type: 'int', default: 0 }, // number of passcode failed attempts
            lastUnlockedTimestamp: 'int?', // last time app unlocked
            purgeOnBruteForce: { type: 'bool', default: false }, // purge all data on many passcode failed attempt
            biometricMethod: 'string?', // biometric auth method
            passcodeFallback: { type: 'bool', default: false }, // fallback to passcode in case of biometric fail
            language: { type: 'string', default: AppConfig.defaultLanguage }, // default app language
            currency: { type: 'string', default: AppConfig.defaultCurrency }, // currency
            defaultNode: { type: 'string', default: AppConfig.nodes.main[0] },
            defaultExplorer: { type: 'string', default: AppConfig.explorer[0].value }, // default explorer
            baseReserve: { type: 'double', default: AppConfig.network.baseReserve }, // network base reserve
            ownerReserve: { type: 'double', default: AppConfig.network.ownerReserve }, // network owner reserve
            hapticFeedback: { type: 'bool', default: true }, // enable haptic feedback
            discreetMode: { type: 'bool', default: false }, // Discreet Mode
            showFiatPanel: { type: 'bool', default: true }, // Show extra balance fiat panel in the home screen
            useSystemSeparators: { type: 'bool', default: true }, // Use system separators
            developerMode: { type: 'bool', default: false }, // Developer mode
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
    public currency: string;
    public defaultNode: string;
    public defaultExplorer: string;
    public baseReserve: number;
    public ownerReserve: number;
    public hapticFeedback: boolean;
    public discreetMode: boolean;
    public showFiatPanel: boolean;
    public useSystemSeparators: boolean;
    public developerMode: boolean;
    public theme: Themes;

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Core model to 12');

        const newObjects = newRealm.objects('Core') as Core[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].showFiatPanel = true;
            // replace xrplorer with bithomp as it's been removed
            if (newObjects[i].defaultExplorer === 'xrplorer') {
                newObjects[i].defaultExplorer = 'bithomp';
            }
        }
    }
}

export default Core;
