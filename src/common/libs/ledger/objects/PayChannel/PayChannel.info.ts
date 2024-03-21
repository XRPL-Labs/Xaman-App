import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import PayChannel from '@common/libs/ledger/objects/PayChannel/PayChannel.class';

/* Types ==================================================================== */
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PayChannelInfo extends ExplainerAbstract<PayChannel> {
    constructor(item: PayChannel, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.paymentChannel');
    }

    generateDescription(): string {
        const { Expiration, Account, Destination, Index, Amount, SourceTag, DestinationTag, SettleDelay, CancelAfter } =
            this.item;

        const content: string[] = [];

        content.push(
            Localize.t('events.accountCreatedAPaymentChannelTo', {
                account: Account,
                destination: Destination,
            }),
        );

        content.push(
            Localize.t('events.theChannelIdIs', {
                channel: Index,
            }),
        );

        content.push(
            Localize.t('events.theChannelAmountIs', {
                amount: Amount!.value,
                currency: Amount!.currency,
            }),
        );
        if (SourceTag !== undefined) {
            content.push(Localize.t('events.theASourceTagIs', { tag: SourceTag }));
        }

        if (DestinationTag !== undefined) {
            content.push(Localize.t('events.theDestinationTagIs', { tag: DestinationTag }));
        }

        if (Expiration) {
            content.push(Localize.t('events.theChannelExpiresAt', { expiration: Expiration }));
        }

        if (SettleDelay) {
            content.push(Localize.t('events.theChannelHasASettlementDelay', { delay: SettleDelay }));
        }

        if (CancelAfter) {
            content.push(
                Localize.t('events.itCanBeCancelledAfter', {
                    cancelAfter: moment(CancelAfter).format('LLLL'),
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination, tag: this.item.DestinationTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: undefined,
            factor: {
                currency: this.item.Amount!.currency,
                value: this.item.Amount!.value,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default PayChannelInfo;
