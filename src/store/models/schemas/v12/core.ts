/**
 * App Core Schema v12
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
            defaultNode: { type: 'string', default: NetworkConfig.legacy.defaultNode },
            defaultExplorer: { type: 'string', default: NetworkConfig.legacy.defaultExplorer },
            baseReserve: { type: 'double', default: NetworkConfig.baseReserve },
            ownerReserve: { type: 'double', default: NetworkConfig.ownerReserve },
            hapticFeedback: { type: 'bool', default: true },
            discreetMode: { type: 'bool', default: false },
            showFiatPanel: { type: 'bool', default: true },
            useSystemSeparators: { type: 'bool', default: true },
            developerMode: { type: 'bool', default: false },
            theme: { type: 'string', default: AppConfig.defaultTheme },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Core schema to 12');

        const newObjects = newRealm.objects(CoreSchema.schema.name) as any;

        for (let i = 0; i < newObjects.length; i++) {
            // by default show reserve fiat panel in home screen
            newObjects[i].showFiatPanel = true;

            // replace deprecated "xrplorer" and "xrpintel" with "bithomp"
            if (newObjects[i].defaultExplorer === 'xrplorer' || newObjects[i].defaultExplorer === 'xrpintel') {
                newObjects[i].defaultExplorer = 'bithomp';
            }
        }
    },
};

export default <ExtendedSchemaType>CoreSchema;
