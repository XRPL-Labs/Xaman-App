import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountModel } from '@store/models';

import Payment from './Payment.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PaymentInfo extends ExplainerAbstract<Payment> {
    constructor(item: Payment & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if ([this.item.Account, this.item.Destination].indexOf(this.account.address) === -1) {
            const balanceChanges = this.item.BalanceChange(this.account.address);
            if (balanceChanges?.sent && balanceChanges?.received) {
                return Localize.t('events.exchangedAssets');
            }
            return Localize.t('global.payment');
        }
        if (this.item.Destination === this.account.address) {
            return Localize.t('events.paymentReceived');
        }

        return Localize.t('events.paymentSent');
    }

    generateDescription(): string {
        const content: string[] = [];

        if (typeof this.item.SourceTag !== 'undefined') {
            content.push(Localize.t('events.thePaymentHasASourceTag', { tag: this.item.SourceTag }));
        }

        if (typeof this.item.DestinationTag !== 'undefined') {
            content.push(Localize.t('events.thePaymentHasADestinationTag', { tag: this.item.DestinationTag }));
        }

        content.push(
            Localize.t('events.itWasInstructedToDeliver', {
                amount: this.item.Amount!.value,
                currency: NormalizeCurrencyCode(this.item.Amount!.currency),
            }),
        );

        if (typeof this.item.SendMax !== 'undefined') {
            content.push(
                Localize.t('events.bySpendingUpTo', {
                    amount: this.item.SendMax.value,
                    currency: NormalizeCurrencyCode(this.item.SendMax.currency),
                }),
            );
        }

        return content.join(' \n');
    }

    getParticipants() {
        // 3rd party consuming own offer
        if ([this.item.Account, this.item.Destination].indexOf(this.account.address) === -1) {
            return {
                start: { address: this.item.Account, tag: this.item.SourceTag },
                through: { address: this.account.address },
                end: { address: this.item.Destination, tag: this.item.DestinationTag },
            };
        }

        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination, tag: this.item.DestinationTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.DeliveredAmount!.currency,
                value: this.item.DeliveredAmount!.currency,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default PaymentInfo;
