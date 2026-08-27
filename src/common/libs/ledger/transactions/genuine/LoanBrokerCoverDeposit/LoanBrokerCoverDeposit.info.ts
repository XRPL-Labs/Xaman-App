import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanBrokerCoverDeposit from './LoanBrokerCoverDeposit.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanBrokerCoverDepositInfo extends ExplainerAbstract<LoanBrokerCoverDeposit, MutationsMixinType> {
    constructor(item: LoanBrokerCoverDeposit & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loanBroker.depositCoverTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loanBroker.depositCoverDescription'));
        content.push(Localize.t('loanBroker.objLoanBrokerId', { brokerId: this.item.LoanBrokerID }));

        if (this.item.Amount) {
            content.push(Localize.t('loanBroker.objAmount', { value: this.item.Amount.value }));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
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
export default LoanBrokerCoverDepositInfo;
