import Localize from '@locale';

import { AccountModel } from '@store/models';

import PaymentChannelFund from './PaymentChannelFund.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PaymentChannelFundInfo extends ExplainerAbstract<PaymentChannelFund, MutationsMixinType> {
    constructor(item: PaymentChannelFund & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.fundPaymentChannel');
    }

    generateDescription(): string {
        const { Channel, Amount } = this.item;

        const content: string[] = [];

        content.push(Localize.t('events.itWillUpdateThePaymentChannel', { channel: Channel }));
        content.push(
            Localize.t('events.itWillIncreaseTheChannelAmount', {
                amount: Amount!.value,
                currency: Amount!.currency,
            }),
        );

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
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
export default PaymentChannelFundInfo;
