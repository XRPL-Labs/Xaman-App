import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import PaymentChannelCreate from './PaymentChannelCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PaymentChannelCreateInfo extends ExplainerAbstract<PaymentChannelCreate> {
    constructor(item: PaymentChannelCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.createPaymentChannel');
    }

    generateDescription(): string {
        const { Account, Destination, ChannelID, Amount, SourceTag, DestinationTag, SettleDelay, CancelAfter } =
            this.item;

        const content: string[] = [];

        content.push(
            Localize.t('events.accountWillCreateAPaymentChannelTo', {
                account: Account,
                destination: Destination,
            }),
        );

        content.push(
            Localize.t('events.theChannelIdIs', {
                channel: ChannelID,
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
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.Amount!.currency,
                value: this.item.Amount!.value,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default PaymentChannelCreateInfo;
