import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import Vault from './Vault.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class VaultInfo extends ExplainerAbstract<Vault> {
    constructor(item: Vault, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.title');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(Localize.t('vault.eventThisIsA'));

        // Get the vault's asset currency - this should be used for all amount displays
        const assetCurrencyCode = this.item.Asset?.currency
            ? NormalizeCurrencyCode(this.item.Asset.currency)
            : '';

        if (this.item.Asset) {
            content.push(Localize.t('vault.objAsset', { asset: assetCurrencyCode }));
        }

        if (this.item.AssetsTotal) {
            content.push(Localize.t('vault.objAssetsTotal', {
                value: this.item.AssetsTotal.value,
                currency: assetCurrencyCode,
            }));
        }

        if (this.item.AssetsAvailable) {
            content.push(Localize.t('vault.objAssetsAvailable', {
                value: this.item.AssetsAvailable.value,
                currency: assetCurrencyCode,
            }));
        }

        if (this.item.AssetsMaximum) {
            content.push(Localize.t('vault.objAssetsMaximum', {
                value: this.item.AssetsMaximum.value,
                currency: assetCurrencyCode,
            }));
        }

        if (typeof this.item.Scale !== 'undefined') {
            content.push(Localize.t('vault.objScale', { value: this.item.Scale }));
        }

        if (typeof this.item.WithdrawalPolicy !== 'undefined') {
            content.push(Localize.t('vault.objWithdrawalPolicy', { value: this.item.WithdrawalPolicy }));
        }

        if (this.item.ShareMPTID) {
            content.push(Localize.t('vault.objMPTID', { value: this.item.ShareMPTID }));
        }

        if (this.item.LossUnrealized) {
            content.push(Localize.t('vault.objLossUnrealized', {
                value: this.item.LossUnrealized.value,
                currency: assetCurrencyCode,
            }));
        }

        if (this.item.isPrivate) {
            content.push(Localize.t('vault.isPrivateExplain'));
        }

        if (this.item.DomainID) {
            content.push(Localize.t('vault.objDomainId', { domainId: this.item.DomainID }));
        }

        if (this.item.Data) {
            content.push(Localize.t('vault.objData', { value: this.item.Data }));
        }

        if (typeof this.item.Sequence !== 'undefined') {
            content.push(Localize.t('vault.objSequence', { value: this.item.Sequence }));
        }

        return content.join('\n\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Owner, tag: undefined },
        };
    }

    getMonetaryDetails() {
        // Show AssetsTotal as the vault's balance in the Owned tab
        const factor = this.item.AssetsTotal
            ? [
                  {
                      currency: this.item.Asset?.currency
                          ? NormalizeCurrencyCode(this.item.Asset.currency)
                          : '',
                      value: this.item.AssetsTotal.value,
                      effect: MonetaryStatus.IMMEDIATE_EFFECT,
                      action: undefined, // No action - this is a balance, not a change
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
export default VaultInfo;
