import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import VaultClawback from './VaultClawback.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class VaultClawbackInfo extends ExplainerAbstract<VaultClawback, MutationsMixinType> {
    constructor(item: VaultClawback & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.clawbackTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.clawbackDescription'));
        content.push(Localize.t('vault.clawbackFrom', { vaultId: this.item.VaultID }));

        if (this.item.Holder) {
            content.push(Localize.t('vault.objHolder', { address: this.item.Holder }));
        }

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
            end: { address: this.item.Holder, tag: undefined },
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
export default VaultClawbackInfo;
