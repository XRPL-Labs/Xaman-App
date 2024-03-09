import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import EscrowCreate from './EscrowCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class EscrowCreateInfo extends ExplainerAbstract<EscrowCreate, MutationsMixinType> {
    constructor(item: EscrowCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.createEscrow');
    }

    generateDescription(): string {
        const content = [
            Localize.t('events.theEscrowIsFromTo', {
                account: this.item.Account,
                destination: this.item.Destination,
            }),
        ];

        if (typeof this.item.DestinationTag !== 'undefined') {
            content.push(Localize.t('events.theEscrowHasADestinationTag', { tag: this.item.DestinationTag }));
        }

        content.push(
            Localize.t('events.itEscrowedWithCurrency', {
                amount: this.item.Amount!.value,
                currency: this.item.Amount!.currency,
            }),
        );

        if (typeof this.item.CancelAfter !== 'undefined') {
            content.push(
                Localize.t('events.itCanBeCanceledAfter', { date: moment(this.item.CancelAfter).format('LLLL') }),
            );
        }

        if (typeof this.item.FinishAfter !== 'undefined') {
            content.push(
                Localize.t('events.itCanBeFinishedAfter', { date: moment(this.item.FinishAfter).format('LLLL') }),
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
                effect: MonetaryStatus.POTENTIAL_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default EscrowCreateInfo;
