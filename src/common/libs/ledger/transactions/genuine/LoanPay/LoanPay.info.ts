import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanPay from './LoanPay.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanPayInfo extends ExplainerAbstract<LoanPay, MutationsMixinType> {
    constructor(item: LoanPay & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loan.paymentTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loan.objLoanId', { loanId: this.item.LoanID }));

        if (this.item.isFullPayment) {
            content.push(Localize.t('loan.fullPaymentDescription'));
        } else if (this.item.isOverpayment) {
            content.push(Localize.t('loan.overpaymentDescription'));
        } else {
            content.push(Localize.t('loan.paymentDescription'));
        }

        if (this.item.Amount) {
            content.push(Localize.t('loan.objPaymentAmount', { value: this.item.Amount.value }));
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
export default LoanPayInfo;
