import { isUndefined } from 'lodash';
import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import { TransactionTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import PaymentChannelCreate from './PaymentChannelCreateClass';

/* Descriptor ==================================================================== */
const PaymentChannelCreateInfo = {
    getLabel: (): string => {
        return Localize.t('events.createPaymentChannel');
    },

    getDescription: (tx: PaymentChannelCreate): string => {
        let content = '';

        content += Localize.t(
            // @ts-ignore
            tx.Type === LedgerEntryTypes.PayChannel
                ? 'events.accountCreatedAPaymentChannelTo'
                : 'events.accountWillCreateAPaymentChannelTo',
            {
                account: tx.Account.address,
                destination: tx.Destination.address,
            },
        );
        content += '\n';

        content += Localize.t('events.theChannelIdIs', {
            // @ts-ignore
            channel: tx.Type === LedgerEntryTypes.PayChannel ? tx.Index : tx.ChannelID,
        });
        content += '\n';

        if (tx.Type === TransactionTypes.PaymentChannelCreate) {
            content += Localize.t('events.theChannelAmountIs', {
                amount: tx.Amount.value,
                currency: tx.Amount.currency,
            });
            content += '\n';
        }

        if (!isUndefined(tx.Account?.tag)) {
            content += Localize.t('events.theASourceTagIs', { tag: tx.Account.tag });
            content += ' \n';
        }

        if (!isUndefined(tx.Destination?.tag)) {
            content += Localize.t('events.theDestinationTagIs', { tag: tx.Destination.tag });
            content += ' \n';
        }

        // @ts-ignore
        if (tx.Type === LedgerEntryTypes.PayChannel && tx.Expiration) {
            // @ts-ignore
            content += Localize.t('events.theChannelExpiresAt', { expiration: moment(tx.Expiration).format('LLLL') });
            content += ' \n';
        }

        if (!isUndefined(tx.SettleDelay)) {
            content += Localize.t('events.theChannelHasASettlementDelay', { delay: tx.SettleDelay });
            content += ' \n';
        }

        if (tx.CancelAfter) {
            content += Localize.t('events.itCanBeCancelledAfter', {
                cancelAfter: moment(tx.CancelAfter).format('LLLL'),
            });
        }

        return content;
    },

    getRecipient: (tx: PaymentChannelCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default PaymentChannelCreateInfo;
