import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanBrokerCoverWithdraw from './LoanBrokerCoverWithdraw.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanBrokerCoverWithdrawInfo extends ExplainerAbstract<LoanBrokerCoverWithdraw, MutationsMixinType> {
    constructor(item: LoanBrokerCoverWithdraw & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loanBroker.withdrawCoverTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loanBroker.withdrawCoverDescription'));
        content.push(Localize.t('loanBroker.objLoanBrokerId', { brokerId: this.item.LoanBrokerID }));

        if (this.item.Amount) {
            content.push(Localize.t('loanBroker.objAmount', { value: this.item.Amount.value }));
        }

        if (this.item.Destination) {
            content.push(Localize.t('loanBroker.objDestination', { address: this.item.Destination }));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.Destination ? { address: this.item.Destination, tag: undefined } : undefined,
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
export default LoanBrokerCoverWithdrawInfo;
