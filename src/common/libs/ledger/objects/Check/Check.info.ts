import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountModel } from '@store/models';

import Check from '@common/libs/ledger/objects/Check/Check.class';

/* Types ==================================================================== */

import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

/* Descriptor ==================================================================== */
class CheckInfo extends ExplainerAbstract<Check> {
    constructor(item: Check & MutationsMixinType, account: AccountModel) {
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
            mutate: undefined,
            factor: {
                currency: this.item.SendMax!.currency,
                value: this.item.SendMax!.currency,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default CheckInfo;
