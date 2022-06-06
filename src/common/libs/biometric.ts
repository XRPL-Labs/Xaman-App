/**
 * Biometric
 * Biometric Purchase module helper
 *
 */
import { NativeModules } from 'react-native';

import { BiometryType } from '@store/types';

/* Const ==================================================================== */
const { BiometricModule } = NativeModules;

export enum BiometricErrors {
    ERROR_USER_CANCEL = 'USER_CANCEL',
    ERROR_NOT_SUPPORTED = 'BIOMETRIC_NOT_SUPPORTED',
    ERROR_NOT_ENROLLED = 'NOT_ENROLLED',
    ERROR_NOT_AVAILABLE = 'NOT_AVAILABLE',
    ERROR_BIOMETRIC = 'BIOMETRIC_ERROR',
    ERROR_NOT_MEET_SECURITY_REQUIREMENTS = 'NOT_MEET_SECURITY_REQUIREMENTS',
    ERROR_BIOMETRIC_HAS_BEEN_CHANGED = 'BIOMETRIC_HAS_BEEN_CHANGED',
    ERROR_UNABLE_REFRESH_AUTHENTICATION_KEY = 'UNABLE_REFRESH_AUTHENTICATION_KEY',
}

/* Lib ==================================================================== */
export const Biometric = {
    /**
     * Authenticate with biometrics
     */
    authenticate: (reason: string): Promise<BiometryType> => {
        return new Promise((resolve, reject) => {
            BiometricModule.authenticate(reason)
                .then((biometryType: BiometryType) => {
                    resolve(biometryType);
                })
                .catch((error: any) => {
                    reject(Biometric.normalizeError(error.code));
                });
        });
    },

    /**
     * check if any sensor is available
     */
    isSensorAvailable: (): Promise<BiometryType> => {
        return new Promise((resolve, reject) => {
            BiometricModule.isSensorAvailable()
                .then((biometryType: BiometryType) => {
                    resolve(biometryType);
                })
                .catch((error: any) => {
                    reject(Biometric.normalizeError(error.code));
                });
        });
    },

    /**
     * Invalid old key and generate new one
     */
    refreshAuthenticationKey: (): Promise<boolean> => {
        return BiometricModule.refreshAuthenticationKey();
    },

    normalizeError: (code: BiometricErrors) => {
        const error = new Error(code);
        error.name = code;
        return error;
    },
};
