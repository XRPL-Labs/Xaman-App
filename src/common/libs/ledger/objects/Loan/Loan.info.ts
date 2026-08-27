import Localize from '@locale';

import { AccountModel } from '@store/models';

import Loan from './Loan.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class LoanInfo extends ExplainerAbstract<Loan> {
    constructor(item: Loan, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loan.title');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(Localize.t('loan.eventThisIsA'));

        if (this.item.LoanBrokerID) {
            content.push(Localize.t('loan.objLoanBrokerId', { brokerId: this.item.LoanBrokerID }));
        }

        if (this.item.Borrower) {
            content.push(Localize.t('loan.objBorrower', { address: this.item.Borrower }));
        }

        if (this.item.PrincipalOutstanding) {
            content.push(Localize.t('loan.objPrincipalOutstanding', { value: this.item.PrincipalOutstanding }));
        }

        if (this.item.TotalValueOutstanding) {
            content.push(Localize.t('loan.objTotalOutstanding', { value: this.item.TotalValueOutstanding }));
        }

        if (this.item.PeriodicPayment) {
            content.push(Localize.t('loan.objPeriodicPayment', { value: this.item.PeriodicPayment }));
        }

        if (typeof this.item.PaymentRemaining !== 'undefined') {
            content.push(Localize.t('loan.objPaymentsRemaining', { value: this.item.PaymentRemaining }));
        }

        if (this.item.PaymentIntervalFormatted) {
            content.push(Localize.t('loan.objPaymentInterval', { value: this.item.PaymentIntervalFormatted }));
        }

        if (this.item.NextPaymentDueDate) {
            const date = new Date(this.item.NextPaymentDueDate * 1000).toLocaleDateString();
            content.push(Localize.t('loan.objNextPaymentDue', { date }));
        }

        if (this.item.GracePeriodFormatted) {
            content.push(Localize.t('loan.objGracePeriod', { value: this.item.GracePeriodFormatted }));
        }

        if (this.item.InterestRatePercent) {
            content.push(Localize.t('loan.objInterestRate', { value: this.item.InterestRatePercent }));
        }

        if (this.item.LateInterestRatePercent) {
            content.push(Localize.t('loan.objLateInterestRate', { value: this.item.LateInterestRatePercent }));
        }

        if (this.item.CloseInterestRatePercent) {
            content.push(Localize.t('loan.objCloseInterestRate', { value: this.item.CloseInterestRatePercent }));
        }

        if (this.item.LoanOriginationFee) {
            content.push(Localize.t('loan.objOriginationFee', { value: this.item.LoanOriginationFee }));
        }

        if (this.item.LoanServiceFee) {
            content.push(Localize.t('loan.objServiceFee', { value: this.item.LoanServiceFee }));
        }

        if (this.item.LatePaymentFee) {
            content.push(Localize.t('loan.objLatePaymentFee', { value: this.item.LatePaymentFee }));
        }

        if (this.item.ClosePaymentFee) {
            content.push(Localize.t('loan.objClosePaymentFee', { value: this.item.ClosePaymentFee }));
        }

        if (this.item.isDefaulted) {
            content.push(Localize.t('loan.objDefaulted'));
        }

        if (this.item.isImpaired) {
            content.push(Localize.t('loan.objImpaired'));
        }

        return content.join('\n\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Borrower, tag: undefined },
        };
    }

    getMonetaryDetails() {
        // Show TotalValueOutstanding as the loan's balance in the Owned tab
        const factor = this.item.TotalValueOutstanding
            ? [
                  {
                      currency: '',
                      value: this.item.TotalValueOutstanding,
                      effect: MonetaryStatus.IMMEDIATE_EFFECT,
                      action: undefined,
                  },
              ]
            : undefined;

        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor,
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [];
    }
}

/* Export ==================================================================== */
export default LoanInfo;
