/**
 * App Core Schema v1
 */

import { AppConfig, NetworkConfig } from '@common/constants';

/* Schema  ==================================================================== */
const CoreSchema = {
    schema: {
        name: 'Core',
        properties: {
            initialized: { type: 'bool', default: false },
            passcode: 'string?',
            minutesAutoLock: { type: 'int', default: 1 },
            timePassLocked: 'int?',
            passcodeAttempts: { type: 'int', default: 0 },
            lastUnlocked: 'int?',
            biometricMethod: 'string?',
            passcodeFallback: { type: 'bool', default: false },
            language: { type: 'string', default: AppConfig.defaultLanguage },
            defaultNode: { type: 'string', default: NetworkConfig.legacy.defaultNode },
            showMemoAlert: { type: 'bool', default: true },
        },
    },
};

export default CoreSchema;
