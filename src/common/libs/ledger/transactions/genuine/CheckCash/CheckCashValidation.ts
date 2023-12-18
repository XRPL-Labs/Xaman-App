import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import CheckCash from './CheckCashClass';

/* Validator ==================================================================== */
const CheckCashValidation = (tx: CheckCash): Promise<void> => {
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
        if (tx.Amount && Number(tx.Amount.value) > Number(tx.Check.SendMax.value)) {
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
        if (tx.DeliverMin && Number(tx.DeliverMin.value) > Number(tx.Check.SendMax.value)) {
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
        if (tx.Account.address !== tx.Check.Destination.address) {
            reject(new Error(Localize.t('payload.checkCanOnlyCashByCheckDestination')));
            return;
        }

        resolve();
    });
};

/* Export ==================================================================== */
export default CheckCashValidation;
