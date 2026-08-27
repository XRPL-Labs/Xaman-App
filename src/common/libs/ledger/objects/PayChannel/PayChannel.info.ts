import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import PayChannel from '@common/libs/ledger/objects/PayChannel/PayChannel.class';

/* Types ==================================================================== */
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
import { remainingPayChannelAmount } from '@common/libs/ledger/utils/payChannelAmounts';

/* Descriptor ==================================================================== */
class PayChannelInfo extends ExplainerAbstract<PayChannel> {
    constructor(item: PayChannel, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.paymentChannel');
    }

    generateDescription(): string {
        const { Expiration, Account, Destination, Index, SourceTag, DestinationTag, SettleDelay, CancelAfter } =
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
        const remaining = remainingPayChannelAmount(this.item.Amount, this.item.Balance);
        const action = OperationActions[this.item.Destination === this.account.address ? 'INC' : 'DEC'];
        const factor = [];

        if (remaining) {
            factor.push({
                ...remaining,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
                action,
            });
        }

        if (this.item.Amount) {
            factor.push({
                ...this.item.Amount,
                effect: MonetaryStatus.NO_EFFECT,
                label: Localize.t('events.payChannelOriginalAmount'),
            });
        }

        if (this.item.Balance) {
            factor.push({
                ...this.item.Balance,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
                action: OperationActions.DEC,
                label: Localize.t('events.payChannelClaimedSoFar'),
            });
        }

        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor,
        };
    }
}

/* Export ==================================================================== */
export default PayChannelInfo;
