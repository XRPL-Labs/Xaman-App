import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import CheckCreate from './CheckCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class CheckCreateInfo extends ExplainerAbstract<CheckCreate, MutationsMixinType> {
    constructor(item: CheckCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.createCheck');
    };

    generateDescription = (): string => {
        const { Account, Destination, SourceTag, DestinationTag, SendMax } = this.item;

        const content = [
            Localize.t('events.theCheckIsFromTo', {
                address: Account,
                destination: Destination,
            }),
        ];

        if (typeof SourceTag !== 'undefined') {
            content.push(Localize.t('events.theCheckHasASourceTag', { tag: SourceTag }));
        }

        if (typeof DestinationTag !== 'undefined') {
            content.push(Localize.t('events.theCheckHasADestinationTag', { tag: DestinationTag }));
        }

        content.push(
            Localize.t('events.maximumAmountCheckIsAllowToDebit', {
                value: SendMax!.value,
                currency: NormalizeCurrencyCode(SendMax!.currency),
            }),
        );

        return content.join('\n');
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination, tag: this.item.DestinationTag },
        };
    };

    getMonetaryDetails = () => {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: [
                {
                    currency: this.item.SendMax!.currency,
                    value: this.item.SendMax!.value,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: this.account.address === this.item.Account ? OperationActions.DEC : OperationActions.INC,
                },
            ],
        };
    };
}

/* Export ==================================================================== */
export default CheckCreateInfo;
