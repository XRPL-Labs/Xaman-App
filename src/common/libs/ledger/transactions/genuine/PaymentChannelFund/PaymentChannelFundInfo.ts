import { AccountModel } from '@store/models';

import Localize from '@locale';

import PaymentChannelFund from './PaymentChannelFundClass';

/* Descriptor ==================================================================== */
const PaymentChannelFundInfo = {
    getLabel: (): string => {
        return Localize.t('events.fundPaymentChannel');
    },

    getDescription: (tx: PaymentChannelFund): string => {
        let content = '';

        content += Localize.t('events.itWillUpdateThePaymentChannel', { channel: tx.Channel });
        content += '\n';
        content += Localize.t('events.itWillIncreaseTheChannelAmount', {
            amount: tx.Amount.value,
            currency: tx.Amount.currency,
        });

        return content;
    },

    getRecipient: (tx: PaymentChannelFund, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default PaymentChannelFundInfo;
