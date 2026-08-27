import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanBrokerSet from './LoanBrokerSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class LoanBrokerSetInfo extends ExplainerAbstract<LoanBrokerSet, MutationsMixinType> {
    constructor(item: LoanBrokerSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return this.item.isUpdate ? Localize.t('loanBroker.updateTitle') : Localize.t('loanBroker.createTitle');
    }

    generateDescription(): string {
        const content = [];

        if (this.item.isUpdate) {
            content.push(Localize.t('loanBroker.updateDescription'));
            content.push(Localize.t('loanBroker.objLoanBrokerId', { brokerId: this.item.LoanBrokerID }));
        } else {
            content.push(Localize.t('loanBroker.createDescription'));
        }

        content.push(Localize.t('loanBroker.objVaultId', { vaultId: this.item.VaultID }));

        if (typeof this.item.CoverRateMinimum !== 'undefined') {
            const rate = `${(this.item.CoverRateMinimum / 10000).toFixed(2)}%`;
            content.push(Localize.t('loanBroker.objCoverRateMinimum', { value: rate }));
        }

        if (typeof this.item.CoverRateLiquidation !== 'undefined') {
            const rate = `${(this.item.CoverRateLiquidation / 10000).toFixed(2)}%`;
            content.push(Localize.t('loanBroker.objCoverRateLiquidation', { value: rate }));
        }

        if (typeof this.item.ManagementFeeRate !== 'undefined') {
            const rate = `${(this.item.ManagementFeeRate / 10000).toFixed(2)}%`;
            content.push(Localize.t('loanBroker.objManagementFeeRate', { value: rate }));
        }

        if (this.item.DebtMaximum) {
            content.push(Localize.t('loanBroker.objDebtMaximum', { value: this.item.DebtMaximum.value }));
        }

        if (this.item.Data) {
            content.push(Localize.t('loanBroker.objData', { value: this.item.Data }));
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
export default LoanBrokerSetInfo;
