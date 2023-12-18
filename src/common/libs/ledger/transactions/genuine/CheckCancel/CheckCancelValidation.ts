import Localize from '@locale';

import CheckCancel from './CheckCancelClass';

/* Validator ==================================================================== */
const CheckCancelValidation = (tx: CheckCancel): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tx.Check) {
            reject(new Error(Localize.t('payload.unableToGetCheckObject')));
            return;
        }

        // The source or the destination of the check can cancel a Check at any time using this transaction type.
        // If the Check has expired, any address can cancel it.
        if (!tx.isExpired) {
            if (
                tx.Account.address !== tx.Check.Destination.address &&
                tx.Account.address !== tx.Check.Account.address
            ) {
                reject(new Error(Localize.t('payload.nonExpiredCheckCanOnlyCancelByCreatedAccount')));
                return;
            }
        }

        resolve();
    });
};

/* Export ==================================================================== */
export default CheckCancelValidation;
