import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import CheckCash from './CheckCash.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CheckCashValidation: ValidationType<CheckCash> = (tx: CheckCash): Promise<void> => {
    return new Promise((resolve, reject) => {
        // check object should be assigned
        if (!tx.Check) {
            reject(new Error(Localize.t('payload.unableToGetCheckObject')));
            return;
        }
        // The user must enter an amount
        if (
            (!tx.Amount || !tx.Amount?.value || tx.Amount?.value === '0') &&
            (!tx.DeliverMin || !tx.DeliverMin?.value || tx.DeliverMin?.value === '0')
        ) {
            reject(new Error(Localize.t('send.pleaseEnterAmount')));
            return;
        }

        // check if the entered amount don't exceed the cash amount
        if (tx.Check?.SendMax && tx.Amount && Number(tx.Amount.value) > Number(tx.Check.SendMax.value)) {
            reject(
                new Error(
                    Localize.t('payload.insufficientCashAmount', {
                        amount: tx.Check.SendMax.value,
                        currency: NormalizeCurrencyCode(tx.Check.SendMax.currency),
                    }),
                ),
            );
            return;
        }

        // check for insufficient amount
        if (tx.Check?.SendMax && tx.DeliverMin && Number(tx.DeliverMin.value) > Number(tx.Check.SendMax.value)) {
            reject(
                new Error(
                    Localize.t('payload.insufficientCashAmount', {
                        amount: tx.Check.SendMax.value,
                        currency: NormalizeCurrencyCode(tx.Check.SendMax.currency),
                    }),
                ),
            );
            return;
        }

        // the signer should be the same as check destination
        if (tx.Account && tx.Account !== tx.Check.Destination) {
            reject(new Error(Localize.t('payload.checkCanOnlyCashByCheckDestination')));
            return;
        }

        resolve();
    });
};

/* Export ==================================================================== */
export default CheckCashValidation;
