import Localize from '@locale';

import { AccountModel } from '@store/models';

import PaymentChannelClaim from './PaymentChannelClaim.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PaymentChannelClaimInfo extends ExplainerAbstract<PaymentChannelClaim, MutationsMixinType> {
    constructor(item: PaymentChannelClaim & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.claimPaymentChannel');
    }

    generateDescription(): string {
        const { Channel, Balance, IsChannelClosed } = this.item;

        const content: string[] = [];

        content.push(Localize.t('events.itWillUpdateThePaymentChannel', { channel: Channel }));

        if (typeof Balance !== 'undefined') {
            content.push(
                Localize.t('events.theChannelBalanceClaimedIs', {
                    balance: Balance.value,
                    currency: Balance.currency,
                }),
            );
        }

        if (IsChannelClosed) {
            content.push(Localize.t('events.thePaymentChannelWillBeClosed'));
        }

        if (typeof this.item.CredentialIDs !== 'undefined') {
            content.push(
                Localize.t('events.thePaymentIncludesCredentialIds', {
                    credentialIDs: this.item.CredentialIDs.join(', '),
                }),
            );
        }

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
            factor: [
                {
                    currency: (this.item.Amount ?? this.item.Balance)?.currency || '', // Claim can be zero
                    value: (this.item.Amount ?? this.item.Balance)?.value || '0', // Claim can be zero
                    effect: MonetaryStatus.IMMEDIATE_EFFECT,
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default PaymentChannelClaimInfo;
