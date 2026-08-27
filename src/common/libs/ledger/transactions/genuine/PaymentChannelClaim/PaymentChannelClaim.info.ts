import Localize from '@locale';

import { AccountModel } from '@store/models';

import PaymentChannelClaim from './PaymentChannelClaim.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
import { payChannelAmountsFromMeta, remainingPayChannelAmount } from '@common/libs/ledger/utils/payChannelAmounts';

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
        const channel = payChannelAmountsFromMeta(this.item.MetaData, this.item.Channel);
        const remaining = remainingPayChannelAmount(channel.amount, channel.balance);
        const claimedThisTx = remainingPayChannelAmount(channel.balance, channel.previousBalance);
        const factor = [];

        if (remaining) {
            factor.push({
                ...remaining,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
            });
        }

        if (channel.amount) {
            factor.push({
                ...channel.amount,
                effect: MonetaryStatus.NO_EFFECT,
                label: Localize.t('events.payChannelOriginalAmount'),
            });
        }

        if (channel.balance) {
            factor.push({
                ...channel.balance,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
                action: OperationActions.DEC,
                label: Localize.t('events.payChannelClaimedSoFar'),
            });
        }

        if (channel.previousBalance && claimedThisTx && claimedThisTx.value !== '0') {
            factor.push({
                ...claimedThisTx,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
                action: OperationActions.DEC,
                label: Localize.t('events.payChannelClaimedThisTx'),
            });
        }

        const emptyMutate = {
            [OperationActions.INC]: [],
            [OperationActions.DEC]: [],
        };

        let mutate = emptyMutate;
        try {
            mutate = this.item.BalanceChange?.(this.account?.address) ?? emptyMutate;
        } catch {
            mutate = emptyMutate;
        }

        return {
            mutate,
            factor,
        };
    }
}

/* Export ==================================================================== */
export default PaymentChannelClaimInfo;
