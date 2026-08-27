import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import VaultSet from './VaultSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class VaultSetInfo extends ExplainerAbstract<VaultSet, MutationsMixinType> {
    constructor(item: VaultSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.setTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.setDescription'));
        content.push(Localize.t('vault.theVaultIdIs', { vaultId: this.item.VaultID }));

        if (this.item.AssetsMaximum) {
            const currencyCode = NormalizeCurrencyCode(this.item.AssetsMaximum.currency);
            content.push(Localize.t('vault.objAssetsMaximum', {
                value: this.item.AssetsMaximum.value,
                currency: currencyCode,
            }));
        }

        if (this.item.DomainID) {
            content.push(Localize.t('vault.objDomainId', { domainId: this.item.DomainID }));
        }

        if (this.item.Data) {
            content.push(Localize.t('vault.objData', { value: this.item.Data }));
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
export default VaultSetInfo;
