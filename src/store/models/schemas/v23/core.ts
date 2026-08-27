/**
 * App Core Schema
 */
import Realm from 'realm';

import { AppConfig } from '@common/constants';
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
            hideAdvisoryTransactions: { type: 'bool', default: true },
            hideServiceFeeTransactions: { type: 'bool', default: false },
            discreetMode: { type: 'bool', default: false },
            showReservePanel: { type: 'bool', default: true },
            useSystemSeparators: { type: 'bool', default: true },
            developerMode: { type: 'bool', default: false },
            theme: { type: 'string', default: AppConfig.defaultTheme },
            themeAutoSwitch: { type: 'bool', default: false },
            filterHideZeroValue: { type: 'bool', default: false },
            accountWorthInfo: { type: 'string', default: 'xaman.accountworth|Account Worth' },
            accountWorthActive: { type: 'bool', default: true },
            showPerAssetWorth: { type: 'bool', default: true },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Core schema to 23');

        // update the new core settings
        const newCoreSettings = newRealm.objects('Core') as any;
        if (!newCoreSettings.isEmpty()) {
            // default settings when upgrading
            newCoreSettings[0].filterHideZeroValue = false;
            newCoreSettings[0].accountWorthInfo = 'xaman.accountworth|Account Worth';
            newCoreSettings[0].accountWorthActive = false;
            newCoreSettings[0].showPerAssetWorth = false;
        }
    },
};

export default <ExtendedSchemaType>CoreSchema;
