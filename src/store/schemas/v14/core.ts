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
            network: { type: 'Network' }, // selected network
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
    public network: any;
    public hapticFeedback: boolean;
    public discreetMode: boolean;
    public showFiatPanel: boolean;
    public useSystemSeparators: boolean;
    public developerMode: boolean;
    public theme: Themes;

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Core model to 14');

        // get network objects
        const networks = newRealm.objects('Network') as any[];

        // by default select network id zero
        let selectedNetworkId = 0;

        // get core settings to determine which nodes/network we should select as default
        const oldCoreSettings = oldRealm.objects('Core') as any[];

        // no coreSetting found
        if (typeof oldCoreSettings !== 'undefined' && oldCoreSettings.length > 0) {
            const { defaultNode } = oldCoreSettings[0];
            for (let i = 0; i < AppConfig.networks.length; i++) {
                if (AppConfig.networks[i].nodes.includes(defaultNode)) {
                    selectedNetworkId = AppConfig.networks[i].networkId;
                }
            }
        }

        // set selected network to the core
        const selectedNetwork = networks.find((n) => n.networkId === selectedNetworkId);

        // update the new core settings
        const newCoreSettings = newRealm.objects('Core') as any[];
        if (typeof newCoreSettings !== 'undefined' && newCoreSettings.length > 0) {
            newCoreSettings[0].network = selectedNetwork;
        }
    }

    public static populate(realm: any) {
        // get all networks
        const networks = realm.objects('Network') as any[];

        const defaultNetworkId = AppConfig.networks[0].networkId;
        const selectedNetwork = networks.find((n) => n.networkId === defaultNetworkId);

        realm.create(Core.schema.name, {
            network: selectedNetwork,
        });
    }
}

export default Core;
