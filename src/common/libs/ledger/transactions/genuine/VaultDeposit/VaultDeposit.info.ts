import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import VaultDeposit from './VaultDeposit.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Class ==================================================================== */
class VaultDepositInfo extends ExplainerAbstract<VaultDeposit, MutationsMixinType> {
    constructor(item: VaultDeposit & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.depositTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.depositDescription'));
        content.push(Localize.t('vault.depositingTo', { vaultId: this.item.VaultID }));

        if (this.item.Amount) {
            const currencyCode = NormalizeCurrencyCode(this.item.Amount.currency);
            content.push(Localize.t('vault.objAmount', {
                value: this.item.Amount.value,
                currency: currencyCode,
            }));
        }

        return content.join('\n\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    }

    getMonetaryDetails() {
        // For VaultDeposit, we want to show the deposited amount (from Amount field),
        // not the MPT shares received (from BalanceChange). The BalanceChange would show
        // the vault share tokens received, but we want to display the actual asset deposited.
        const currency = this.item.Amount?.mpt_issuance_id
            ? 'tokens'
            : this.item.Amount?.currency
              ? NormalizeCurrencyCode(this.item.Amount.currency)
              : '';

        const factor = this.item.Amount && currency
            ? [
                  {
                      currency,
                      value: this.item.Amount.value,
                      effect: MonetaryStatus.IMMEDIATE_EFFECT,
                      action: OperationActions.DEC,
                  },
              ]
            : undefined;

        // Return empty mutate so factor is used - we want to show deposit amount, not MPT shares received
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor,
        };
    }
}

/* Export ==================================================================== */
export default VaultDepositInfo;
