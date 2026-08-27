import Localize from '@locale';

import { AccountModel } from '@store/models';

import VaultDelete from './VaultDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class VaultDeleteInfo extends ExplainerAbstract<VaultDelete, MutationsMixinType> {
    constructor(item: VaultDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('vault.deleteTitle');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('vault.thisTxDeletesVaultId', { vaultId: this.item.VaultID }));

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
export default VaultDeleteInfo;
