import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import Check from '@common/libs/ledger/objects/Check/Check.class';

/* Types ==================================================================== */

import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class CheckInfo extends ExplainerAbstract<Check> {
    constructor(item: Check, account: AccountModel) {
        super(item, account);
    }
    getEventsLabel = (): string => {
        return Localize.t('global.check');
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
        const { Account, SourceTag, Destination, DestinationTag } = this.item;
        return {
            start: { address: Account, tag: SourceTag },
            end: { address: Destination, tag: DestinationTag },
        };
    };

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor: [
                {
                    currency: this.item.SendMax!.currency,
                    value: this.item.SendMax!.value,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: OperationActions[this.item.Destination === this.account.address ? 'INC' : 'DEC'],
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default CheckInfo;
