import { AccountModel } from '@store/models';

import Localize from '@locale';

import PaymentChannelClaim from './PaymentChannelClaimClass';

/* Descriptor ==================================================================== */
const PaymentChannelClaimInfo = {
    getLabel: (): string => {
        return Localize.t('events.claimPaymentChannel');
    },

    getDescription: (tx: PaymentChannelClaim): string => {
        let content = '';

        content += Localize.t('events.itWillUpdateThePaymentChannel', { channel: tx.Channel });
        content += '\n';

        if (tx.Balance) {
            content += Localize.t('events.theChannelBalanceClaimedIs', {
                balance: tx.Balance.value,
                currency: tx.Balance.currency,
            });
            content += '\n';
        }

        if (tx.IsClosed) {
            content += Localize.t('events.thePaymentChannelWillBeClosed');
        }

        return content;
    },

    getRecipient: (tx: PaymentChannelClaim, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default PaymentChannelClaimInfo;
