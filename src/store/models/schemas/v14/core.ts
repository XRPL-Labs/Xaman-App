/**
 * App Core Schema
 */
import Realm from 'realm';

import { AppConfig, NetworkConfig } from '@common/constants';
import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const CoreSchema = {
    schema: {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false },
            passcode: { type: 'string', optional: true },
            minutesAutoLock: { type: 'int', default: 1 },
            lastPasscodeFailedTimestamp: { type: 'int', optional: true },
            passcodeFailedAttempts: { type: 'int', default: 0 },
            lastUnlockedTimestamp: { type: 'int', optional: true },
            purgeOnBruteForce: { type: 'bool', default: false },
            biometricMethod: { type: 'string', optional: true },
            passcodeFallback: { type: 'bool', default: false },
            language: { type: 'string', default: AppConfig.defaultLanguage },
            currency: { type: 'string', default: AppConfig.defaultCurrency },
            network: { type: 'object', objectType: 'Network' },
            account: { type: 'object', objectType: 'Account' },
            hapticFeedback: { type: 'bool', default: true },
            discreetMode: { type: 'bool', default: false },
            showReservePanel: { type: 'bool', default: true },
            useSystemSeparators: { type: 'bool', default: true },
            developerMode: { type: 'bool', default: false },
            theme: { type: 'string', default: AppConfig.defaultTheme },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Core schema to 14');

        // ========== Update selected network ==========
        // get network objects
        const networks = newRealm.objects('Network') as any;
        // get core settings to determine which nodes/network we should select as default
        const oldCoreSettings = oldRealm.objects('Core') as any;

        // update the new core settings
        const newCoreSettings = newRealm.objects('Core') as any;
        if (!newCoreSettings.isEmpty()) {
            // disable developer mode
            newCoreSettings[0].developerMode = false;
            // set the default network to XRPL Mainnet
            newCoreSettings[0].network = networks.find((n: any) => n.id === NetworkConfig.defaultNetworkId);
        }

        // ========== Update selected account ==========
        const oldAccounts = oldRealm.objects('Account') as any;
        const newAccounts = newRealm.objects('Account') as any;
        for (let i = 0; i < oldAccounts.length; i++) {
            if (oldAccounts[i].default) {
                if (!newCoreSettings.isEmpty()) {
                    newCoreSettings[0].account = newAccounts.find((a: any) => a.address === oldAccounts[i].address);
                }
            }
        }

        // ========== Rename filed ==========
        if (!oldCoreSettings.isEmpty()) {
            const { showFiatPanel } = oldCoreSettings[0];
            if (!newCoreSettings.isEmpty()) {
                newCoreSettings[0].showReservePanel = showFiatPanel;
            }
        }
    },
};

export default <ExtendedSchemaType>CoreSchema;
