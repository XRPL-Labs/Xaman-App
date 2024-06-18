import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import Escrow from './Escrow.class';

/* Types ==================================================================== */
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class EscrowInfo extends ExplainerAbstract<Escrow> {
    constructor(item: Escrow, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('global.escrow');
    }

    generateDescription(): string {
        const { Account, Amount, Destination, DestinationTag, CancelAfter, FinishAfter } = this.item;

        const content = [
            Localize.t('events.theEscrowIsFromTo', {
                account: Account,
                destination: Destination,
            }),
        ];

        if (typeof DestinationTag !== 'undefined') {
            content.push(Localize.t('events.theEscrowHasADestinationTag', { tag: DestinationTag }));
        }

        content.push(
            Localize.t('events.itEscrowedWithCurrency', {
                amount: Amount!.value,
                currency: Amount!.currency,
            }),
        );

        if (typeof CancelAfter !== 'undefined') {
            content.push(Localize.t('events.itCanBeCanceledAfter', { date: moment(CancelAfter).format('LLLL') }));
        }

        if (typeof FinishAfter !== 'undefined') {
            content.push(Localize.t('events.itCanBeFinishedAfter', { date: moment(FinishAfter).format('LLLL') }));
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
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor: [
                {
                    currency: this.item.Amount!.currency,
                    value: this.item.Amount!.value,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: OperationActions[this.item.Destination === this.account.address ? 'INC' : 'DEC'],
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default EscrowInfo;
