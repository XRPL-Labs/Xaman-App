/**
 * IAP
 *
 * In-App Purchase module helper
 * Notes: after a success purchase and enabling the product for user we need to call finalizePurchase, otherwise
 * the amount will be refunded to the user.
 * If user doesn't have the permission to make payments, the purchase will be rejected by clear error message
 *
 */
import { NativeModules, Platform } from 'react-native';

/* Const ==================================================================== */
const { InAppPurchaseModule } = NativeModules;

enum ErrorCode {
    E_CLIENT_IS_NOT_READY = 'E_CLIENT_IS_NOT_READY',
    E_PRODUCT_IS_NOT_AVAILABLE = 'E_PRODUCT_IS_NOT_AVAILABLE',
    E_NO_PENDING_PURCHASE = 'E_NO_PENDING_PURCHASE',
    E_PURCHASE_CANCELED = 'E_PURCHASE_CANCELED',
    E_PURCHASE_FAILED = 'E_PURCHASE_FAILED',
    E_FINISH_TRANSACTION_FAILED = 'E_FINISH_TRANSACTION_FAILED',
    E_ALREADY_PURCHASED = 'E_ALREADY_PURCHASED',
    E_UNEXPECTED_ERROR = 'E_UNEXPECTED_ERROR',
}

/* Lib ==================================================================== */
const IAP = {
    ErrorCode,

    /**
     * Restore any old purchases
     */
    restorePurchases: async () => {
        return InAppPurchaseModule.restorePurchases();
    },

    /**
     * Start purchasing flow for productId
     */
    purchase: async (productId: string) => {
        // for Android, we need to make sure the connection to google play is established before triggering billing flow
        if (Platform.OS === 'android') {
            await InAppPurchaseModule.startConnection();
        }

        return InAppPurchaseModule.purchase(productId);
    },

    /**
     * Finalize a purchase with transaction receipt identifier
     */
    finalizePurchase: async (transactionReceiptIdentifier: string) => {
        return InAppPurchaseModule.finalizePurchase(transactionReceiptIdentifier);
    },

    /**
     * Normalizes an error by returning its code, string representation, or a default error code.
     * @param {any} error - The error to be normalized.
     * @returns {string} - The normalized error code, string representation, or a default error code.
     */
    normalizeError: (error: any) => {
        switch (true) {
            case error.code:
                return error.code;
            case typeof error.toString === 'function':
                return error.toString();
            default:
                return ErrorCode.E_UNEXPECTED_ERROR;
        }
    },
};

/* Export ==================================================================== */
export default IAP;
