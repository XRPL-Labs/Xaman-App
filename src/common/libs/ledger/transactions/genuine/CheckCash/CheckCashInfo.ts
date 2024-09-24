import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import CheckCash from './CheckCashClass';

/* Descriptor ==================================================================== */
const CheckCashInfo = {
    getLabel: (): string => {
        return Localize.t('events.cashCheck');
    },

    getDescription: (tx: CheckCash): string => {
        const amount = tx.Amount || tx.DeliverMin;

        return Localize.t('events.itWasInstructedToDeliverByCashingCheck', {
            address: tx.Check?.Destination.address || 'address',
            amount: amount.value,
            currency: NormalizeCurrencyCode(amount.currency),
            checkId: tx.CheckID,
        });
    },

    getRecipient: (tx: CheckCash, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address === account.address && tx.Check) {
            return tx.Check.Account;
        }
        return tx.Account;
    },
};

/* Export ==================================================================== */
export default CheckCashInfo;
