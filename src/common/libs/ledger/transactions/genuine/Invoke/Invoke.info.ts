import Localize from '@locale';

import { AccountModel } from '@store/models';

import Invoke from './Invoke.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class InvokeInfo extends ExplainerAbstract<Invoke> {
    constructor(item: Invoke & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.invoke');
    }

    generateDescription(): string {
        const content = [
            Localize.t('events.invokeInitiatorExplain', {
                address: this.item.Account,
            }),
        ];

        if (typeof this.item.Destination !== 'undefined') {
            content.push(
                Localize.t('events.theTransactionHasADestination', {
                    destination: this.item.Destination,
                }),
            );
        }

        if (typeof this.item.InvoiceID !== 'undefined') {
            content.push(
                Localize.t('events.theTransactionHasAInvoiceId', {
                    invoiceId: this.item.InvoiceID,
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default InvokeInfo;
