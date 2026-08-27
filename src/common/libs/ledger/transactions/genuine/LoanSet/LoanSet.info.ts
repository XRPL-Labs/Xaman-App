import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanSet from './LoanSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanSetInfo extends ExplainerAbstract<LoanSet, MutationsMixinType> {
    constructor(item: LoanSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loan.createTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('loan.createDescription'));
        content.push(Localize.t('loanBroker.objLoanBrokerId', { brokerId: this.item.LoanBrokerID }));

        if (this.item.Counterparty) {
            content.push(Localize.t('loan.objCounterparty', { address: this.item.Counterparty }));
        }

        if (this.item.PrincipalRequested) {
            content.push(Localize.t('loan.objPrincipalRequested', { value: this.item.PrincipalRequested.value }));
        }

        if (typeof this.item.PaymentTotal !== 'undefined') {
            content.push(Localize.t('loan.objPaymentTotal', { value: this.item.PaymentTotal }));
        }

        if (typeof this.item.PaymentInterval !== 'undefined') {
            const days = Math.floor(this.item.PaymentInterval / 86400);
            const hours = Math.floor((this.item.PaymentInterval % 86400) / 3600);
            let formatted = '';
            if (days > 0) {
                formatted = `${days} day${days !== 1 ? 's' : ''}`;
            } else if (hours > 0) {
                formatted = `${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                formatted = `${Math.floor(this.item.PaymentInterval / 60)} minute(s)`;
            }
            content.push(Localize.t('loan.objPaymentInterval', { value: formatted }));
        }

        if (typeof this.item.GracePeriod !== 'undefined') {
            const days = Math.floor(this.item.GracePeriod / 86400);
            const hours = Math.floor((this.item.GracePeriod % 86400) / 3600);
            let formatted = '';
            if (days > 0) {
                formatted = `${days} day${days !== 1 ? 's' : ''}`;
            } else if (hours > 0) {
                formatted = `${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                formatted = `${Math.floor(this.item.GracePeriod / 60)} minute(s)`;
            }
            content.push(Localize.t('loan.objGracePeriod', { value: formatted }));
        }

        if (typeof this.item.InterestRate !== 'undefined') {
            const rate = `${(this.item.InterestRate / 10000).toFixed(2)}%`;
            content.push(Localize.t('loan.objInterestRate', { value: rate }));
        }

        if (typeof this.item.LateInterestRate !== 'undefined') {
            const rate = `${(this.item.LateInterestRate / 10000).toFixed(2)}%`;
            content.push(Localize.t('loan.objLateInterestRate', { value: rate }));
        }

        if (typeof this.item.CloseInterestRate !== 'undefined') {
            const rate = `${(this.item.CloseInterestRate / 10000).toFixed(2)}%`;
            content.push(Localize.t('loan.objCloseInterestRate', { value: rate }));
        }

        if (this.item.LoanOriginationFee) {
            content.push(Localize.t('loan.objOriginationFee', { value: this.item.LoanOriginationFee.value }));
        }

        if (this.item.LoanServiceFee) {
            content.push(Localize.t('loan.objServiceFee', { value: this.item.LoanServiceFee.value }));
        }

        if (this.item.LatePaymentFee) {
            content.push(Localize.t('loan.objLatePaymentFee', { value: this.item.LatePaymentFee.value }));
        }

        if (this.item.ClosePaymentFee) {
            content.push(Localize.t('loan.objClosePaymentFee', { value: this.item.ClosePaymentFee.value }));
        }

        if (this.item.Data) {
            content.push(Localize.t('loan.objData', { value: this.item.Data }));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.Counterparty ? { address: this.item.Counterparty, tag: undefined } : undefined,
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
export default LoanSetInfo;
