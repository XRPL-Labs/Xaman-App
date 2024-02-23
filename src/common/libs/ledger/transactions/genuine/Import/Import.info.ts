import Localize from '@locale';

import { AccountModel } from '@store/models';

import Import from './Import.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class ImportInfo extends ExplainerAbstract<Import> {
    constructor(item: Import & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.import');
    }

    generateDescription(): string {
        const { Issuer } = this.item;

        const content = [Localize.t('events.importTransactionExplain')];

        if (typeof Issuer !== 'undefined') {
            content.push(Localize.t('events.theIssuerIs', { issuer: Issuer }));
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
export default ImportInfo;
