import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import VaultCreate from './VaultCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class VaultCreateInfo extends ExplainerAbstract<VaultCreate, MutationsMixinType> {
    constructor(item: VaultCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.createTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.createDescription'));

        if (this.item.Asset) {
            const currencyCode = NormalizeCurrencyCode(this.item.Asset.currency);
            content.push(Localize.t('vault.objAsset', { asset: currencyCode }));
        }

        if (typeof this.item.Scale !== 'undefined') {
            content.push(Localize.t('vault.objScale', { value: this.item.Scale }));
        }

        if (typeof this.item.WithdrawalPolicy !== 'undefined') {
            content.push(Localize.t('vault.objWithdrawalPolicy', { value: this.item.WithdrawalPolicy }));
        }

        if (this.item.AssetsMaximum) {
            const currencyCode = NormalizeCurrencyCode(this.item.AssetsMaximum.currency);
            content.push(Localize.t('vault.objAssetsMaximum', {
                value: this.item.AssetsMaximum.value,
                currency: currencyCode,
            }));
        }

        if (this.item.isPrivate) {
            content.push(Localize.t('vault.createPrivateDescription'));
        }

        if (this.item.isShareNonTransferable) {
            content.push(Localize.t('vault.createNonTransferableDescription'));
        }

        if (this.item.DomainID) {
            content.push(Localize.t('vault.objDomainId', { domainId: this.item.DomainID }));
        }

        if (this.item.Data) {
            content.push(Localize.t('vault.objData', { value: this.item.Data }));
        }

        if (this.item.MPTokenMetadata) {
            content.push(Localize.t('vault.objMPTokenMetadata', { value: this.item.MPTokenMetadata }));
        }

        return content.join('\n\n');
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
export default VaultCreateInfo;
