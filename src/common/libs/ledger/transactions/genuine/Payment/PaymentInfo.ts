import { isUndefined } from 'lodash';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Payment from './PaymentClass';

/* Descriptor ==================================================================== */
const PaymentInfo = {
    getLabel: (tx: Payment, account: AccountModel): string => {
        if ([tx.Account.address, tx.Destination?.address].indexOf(account.address) === -1) {
            const balanceChanges = tx.BalanceChange(account.address);
            if (balanceChanges?.sent && balanceChanges?.received) {
                return Localize.t('events.exchangedAssets');
            }
            return Localize.t('global.payment');
        }
        if (tx.Destination.address === account.address) {
            return Localize.t('events.paymentReceived');
        }

        return Localize.t('events.paymentSent');
    },

    getDescription: (tx: Payment): string => {
        let content = '';

        if (!isUndefined(tx.Account?.tag)) {
            content += Localize.t('events.thePaymentHasASourceTag', { tag: tx.Account.tag });
            content += ' \n';
        }

        if (!isUndefined(tx.Destination?.tag)) {
            content += Localize.t('events.thePaymentHasADestinationTag', { tag: tx.Destination.tag });
            content += ' \n';
        }

        content += Localize.t('events.itWasInstructedToDeliver', {
            amount: tx.Amount.value,
            currency: NormalizeCurrencyCode(tx.Amount.currency),
        });

        if (tx.SendMax) {
            content += ' ';
            content += Localize.t('events.bySpendingUpTo', {
                amount: tx.SendMax.value,
                currency: NormalizeCurrencyCode(tx.SendMax.currency),
            });
        }
        return content;
    },

    getRecipient: (tx: Payment, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default PaymentInfo;
