import Localize from '@locale';

import { AccountModel } from '@store/models';

import LoanBroker from './LoanBroker.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class LoanBrokerInfo extends ExplainerAbstract<LoanBroker> {
    constructor(item: LoanBroker, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('loanBroker.title');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(Localize.t('loanBroker.eventThisIsA'));

        if (this.item.VaultID) {
            content.push(Localize.t('loanBroker.objVaultId', { vaultId: this.item.VaultID }));
        }

        if (this.item.DebtTotal) {
            content.push(Localize.t('loanBroker.objDebtTotal', { value: this.item.DebtTotal }));
        }

        if (this.item.DebtMaximum) {
            content.push(Localize.t('loanBroker.objDebtMaximum', { value: this.item.DebtMaximum }));
        }

        if (this.item.CoverAvailable) {
            content.push(Localize.t('loanBroker.objCoverAvailable', { value: this.item.CoverAvailable }));
        }

        if (this.item.CoverRateMinimumPercent) {
            content.push(Localize.t('loanBroker.objCoverRateMinimum', { value: this.item.CoverRateMinimumPercent }));
        }

        if (this.item.CoverRateLiquidationPercent) {
            content.push(
                Localize.t('loanBroker.objCoverRateLiquidation', { value: this.item.CoverRateLiquidationPercent }),
            );
        }

        if (this.item.ManagementFeeRatePercent) {
            content.push(Localize.t('loanBroker.objManagementFeeRate', { value: this.item.ManagementFeeRatePercent }));
        }

        if (typeof this.item.LoanSequence !== 'undefined') {
            content.push(Localize.t('loanBroker.objLoanSequence', { value: this.item.LoanSequence }));
        }

        if (typeof this.item.OwnerCount !== 'undefined') {
            content.push(Localize.t('loanBroker.objOwnerCount', { value: this.item.OwnerCount }));
        }

        if (this.item.Data) {
            content.push(Localize.t('loanBroker.objData', { value: this.item.Data }));
        }

        return content.join('\n\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Owner, tag: undefined },
        };
    }

    getMonetaryDetails() {
        // Show CoverAvailable as the broker's balance in the Owned tab
        const factor = this.item.CoverAvailable
            ? [
                  {
                      currency: '',
                      value: this.item.CoverAvailable,
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
export default LoanBrokerInfo;
