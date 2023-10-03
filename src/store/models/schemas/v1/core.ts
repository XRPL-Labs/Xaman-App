/**
 * App Core Schema v1
 */

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
            timePassLocked: { type: 'int', optional: true },
            passcodeAttempts: { type: 'int', default: 0 },
            lastUnlocked: { type: 'int', optional: true },
            biometricMethod: { type: 'string', optional: true },
            passcodeFallback: { type: 'bool', default: false },
            language: { type: 'string', default: AppConfig.defaultLanguage },
            defaultNode: { type: 'string', default: NetworkConfig.legacy.defaultNode },
            showMemoAlert: { type: 'bool', default: true },
        },
    },
};

export default <ExtendedSchemaType>CoreSchema;
