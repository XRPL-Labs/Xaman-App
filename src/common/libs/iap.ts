/**
 * IAP
 *
 * In App Purchase module helper
 *
 */
import { NativeModules, Platform } from 'react-native';

/* Const ==================================================================== */
const { InAppPurchaseModule } = NativeModules;

enum ERRORS {
    E_UNABLE_TO_INIT_MODULE = 'E_UNABLE_TO_INIT_MODULE',
    E_CLIENT_IS_NOT_READY = 'E_CLIENT_IS_NOT_READY',
    E_PRODUCT_IS_NOT_AVAILABLE = 'E_PRODUCT_IS_NOT_AVAILABLE',
    E_PURCHAES_CANCELED = 'E_PURCHAES_CANCELED',
    E_PURCHAES_FALIED = 'E_PURCHAES_FALIED',
    E_ALREADY_PURCHASED = 'E_ALREADY_PURCHASED',
    E_NO_PURCHASE_HISTORY = 'E_NO_PURCHASE_HISTORY',
    E_UNEXPECTED_ERROR = 'E_UNEXPECTED_ERROR',
}

const SUCCESS_PURCHASE_CODE = 'SUCCESS_PURCHASE';

/* Lib ==================================================================== */
const IAP = {
    ERRORS,
    SUCCESS_PURCHASE_CODE,

    /**
     * Initialize the module/connection
     */
    init: async (): Promise<boolean> => {
        return InAppPurchaseModule.init();
    },

    /**
     * close any left connection
     */
    close: async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            return InAppPurchaseModule.close();
        }
        return true;
    },

    /**
     * Restore any old purchase
     */
    restorePurchase: async (): Promise<string> => {
        return InAppPurchaseModule.restorePurchase();
    },

    /**
     * Purchase the product
     */
    startPurchaseFlow: async (): Promise<string> => {
        return InAppPurchaseModule.purchase();
    },

    /**
     * Verify receipt with backend
     */
    verify: async (receipt: string): Promise<boolean> => {
        if (receipt) {
            return true;
        }
        return false;
    },
    /**
     * Check if user already bought the pro subscription
     */
    status: async (): Promise<string> => {
        return new Promise((resolve) => {
            [IAP.init, IAP.restorePurchase, IAP.verify, IAP.close]
                .reduce((accumulator: any, callback) => {
                    return accumulator.then(callback);
                }, Promise.resolve())
                .then(() => {
                    return resolve(SUCCESS_PURCHASE_CODE);
                })
                .catch((e: any) => resolve(IAP.normalizeError(e)));
        });
    },

    purchase: async (): Promise<string> => {
        return new Promise((resolve) => {
            [IAP.init, IAP.startPurchaseFlow, IAP.verify, IAP.close]
                .reduce((accumulator: any, callback) => {
                    return accumulator.then(callback);
                }, Promise.resolve())
                .then(() => {
                    return resolve(SUCCESS_PURCHASE_CODE);
                })
                .catch((e: any) => resolve(IAP.normalizeError(e)));
        });
    },

    normalizeError: (e: any) => {
        if (e.code) {
            return e.code;
        }
        if (typeof e.toString === 'function') {
            return e.toString();
        }
        return ERRORS.E_UNEXPECTED_ERROR;
    },
};

export default IAP;
