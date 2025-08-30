import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import AccountDelete from './AccountDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
export class AccountDeleteInfo extends ExplainerAbstract<AccountDelete, MutationsMixinType> {
    constructor(item: AccountDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.deleteAccount');
    }

    generateDescription(): string {
        const { Account, SourceTag, Destination, DestinationTag } = this.item;

        const balanceChanges = this.item.BalanceChange(Account);
        const Amount = balanceChanges[OperationActions.INC].at(0) ?? balanceChanges[OperationActions.DEC].at(0);

        const content = [
            Localize.t('events.itDeletedAccount', { address: Account }),
            Localize.t('events.itWasInstructedToDeliverTheRemainingBalanceOf', {
                amount: Amount?.value,
                currency: NormalizeCurrencyCode(Amount!.currency),
                destination: Destination,
            }),
        ];

        if (typeof SourceTag !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasASourceTag', { tag: SourceTag }));
        }

        if (typeof SourceTag !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasADestinationTag', { tag: DestinationTag }));
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
                    action:
                        this.account.address === this.item.Destination ? OperationActions.INC : OperationActions.DEC,
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default AccountDeleteInfo;
