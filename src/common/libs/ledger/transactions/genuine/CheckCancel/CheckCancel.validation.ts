import Localize from '@locale';

import CheckCancel from './CheckCancel.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';
import { SignMixinType } from '@common/libs/ledger/mixin/types';

/* Validation ==================================================================== */
const CheckCancelValidation: ValidationType<CheckCancel> = (tx: CheckCancel): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tx.Check) {
            reject(new Error(Localize.t('payload.unableToGetCheckObject')));
            return;
        }

        // The source or the destination of the check can cancel a Check at any time using this transaction type.
        // If the Check has expired, any address can cancel it.
        if (!tx.isExpired) {
            if (tx.Account && tx.Account !== tx.Check.Destination && tx.Account !== tx.Check?.Account) {
                reject(new Error(Localize.t('payload.nonExpiredCheckCanOnlyCancelByCreatedAccount')));
                return;
            }
        }

        resolve();
    });
};

/* Export ==================================================================== */
export default CheckCancelValidation;
