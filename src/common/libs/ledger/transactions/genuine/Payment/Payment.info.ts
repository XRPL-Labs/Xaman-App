import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import Payment from './Payment.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class PaymentInfo extends ExplainerAbstract<Payment, MutationsMixinType> {
    constructor(item: Payment & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        const balanceChanges = this.item.BalanceChange(this.account.address);

        if (!balanceChanges) {
            return Localize.t('global.payment');
        }

        if (balanceChanges[OperationActions.INC].length > 0 && balanceChanges[OperationActions.DEC].length > 0) {
            return Localize.t('events.exchangedAssets');
        }

        if (balanceChanges[OperationActions.INC].length > 0 && balanceChanges[OperationActions.DEC].length === 0) {
            return Localize.t('events.paymentReceived');
        }

        if (balanceChanges[OperationActions.DEC].length > 0 && balanceChanges[OperationActions.INC].length === 0) {
            return Localize.t('events.paymentSent');
        }

        return Localize.t('global.payment');
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

        if (typeof this.item.CredentialIDs !== 'undefined') {
            content.push(
                Localize.t('events.thePaymentIncludesCredentialIds', {
                    credentialIDs: this.item.CredentialIDs.join(', '),
                }),
            );
        }

        return content.join(' \n');
    }

    getParticipants() {
        // 3rd party consuming own offer
        // or regular key
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
            factor: [
                {
                    currency: this.item.DeliveredAmount!.currency,
                    value: this.item.DeliveredAmount!.value,
                    effect: MonetaryStatus.IMMEDIATE_EFFECT,
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default PaymentInfo;
