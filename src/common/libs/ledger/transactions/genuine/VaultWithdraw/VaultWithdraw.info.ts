import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import VaultWithdraw from './VaultWithdraw.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class VaultWithdrawInfo extends ExplainerAbstract<VaultWithdraw, MutationsMixinType> {
    constructor(item: VaultWithdraw & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.withdrawTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.withdrawDescription'));
        content.push(Localize.t('vault.withdrawingFrom', { vaultId: this.item.VaultID }));

        if (this.item.Amount) {
            const currencyCode = NormalizeCurrencyCode(this.item.Amount.currency);
            content.push(Localize.t('vault.objAmount', {
                value: this.item.Amount.value,
                currency: currencyCode,
            }));
        }

        if (this.item.Destination) {
            content.push(Localize.t('vault.objDestination', { address: this.item.Destination }));
            content.push(Localize.t('vault.assetsRecipientExplain'));
        }

        if (typeof this.item.DestinationTag !== 'undefined') {
            content.push(Localize.t('vault.objDestinationTag', { tag: this.item.DestinationTag }));
        }

        return content.join('\n\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.Destination ? { address: this.item.Destination, tag: this.item.DestinationTag } : undefined,
        };
    }

    getMonetaryDetails() {
        // Include factor for pending transactions (before metadata is available)
        // Handle MPT amounts which have mpt_issuance_id instead of currency
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
                  },
              ]
            : undefined;

        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor,
        };
    }
}

/* Export ==================================================================== */
export default VaultWithdrawInfo;
