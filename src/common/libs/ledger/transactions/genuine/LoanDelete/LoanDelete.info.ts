import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanDelete from './LoanDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanDeleteInfo extends ExplainerAbstract<LoanDelete, MutationsMixinType> {
    constructor(item: LoanDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loan.deleteTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loan.deleteDescription'));
        content.push(Localize.t('loan.objLoanId', { loanId: this.item.LoanID }));

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
export default LoanDeleteInfo;
