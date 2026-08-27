import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanManage from './LoanManage.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanManageInfo extends ExplainerAbstract<LoanManage, MutationsMixinType> {
    constructor(item: LoanManage & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loan.manageTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loan.objLoanId', { loanId: this.item.LoanID }));

        if (this.item.isDefault) {
            content.push(Localize.t('loan.manageDefaultDescription'));
        } else if (this.item.isImpair) {
            content.push(Localize.t('loan.manageImpairDescription'));
        } else if (this.item.isUnimpair) {
            content.push(Localize.t('loan.manageUnimpairDescription'));
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
export default LoanManageInfo;
