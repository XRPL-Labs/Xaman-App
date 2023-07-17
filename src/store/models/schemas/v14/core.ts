/**
 * App Core Schema
 */
import Realm from 'realm';

import { AppConfig, NetworkConfig } from '@common/constants';

/* Schema  ==================================================================== */
const CoreSchema = {
    schema: {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false },
            passcode: 'string?',
            minutesAutoLock: { type: 'int', default: 1 },
            lastPasscodeFailedTimestamp: 'int?',
            passcodeFailedAttempts: { type: 'int', default: 0 },
            lastUnlockedTimestamp: 'int?',
            purgeOnBruteForce: { type: 'bool', default: false },
            biometricMethod: 'string?',
            passcodeFallback: { type: 'bool', default: false },
            language: { type: 'string', default: AppConfig.defaultLanguage },
            currency: { type: 'string', default: AppConfig.defaultCurrency },
            network: { type: 'Network' },
            account: { type: 'Account' },
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

        // by default select network id zero
        let selectedNetworkId = 0;

        // check if we have core settings
        if (!oldCoreSettings.isEmpty()) {
            const { defaultNode } = oldCoreSettings[0];
            for (let i = 0; i < NetworkConfig.networks.length; i++) {
                if (NetworkConfig.networks[i].nodes.includes(defaultNode)) {
                    selectedNetworkId = NetworkConfig.networks[i].networkId;
                }
            }
        }

        // update the new core settings
        const newCoreSettings = newRealm.objects('Core') as any;
        if (!newCoreSettings.isEmpty()) {
            newCoreSettings[0].network = networks.find((n: any) => n.id === selectedNetworkId);
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

    populate: (realm: Realm) => {
        // get all networks
        const networks = realm.objects('Network') as any;

        const defaultNetworkId = NetworkConfig.networks[0].networkId;
        const selectedNetwork = networks.find((n: any) => n.id === defaultNetworkId);

        realm.create('Core', {
            network: selectedNetwork,
        });
    },
};

export default CoreSchema;
