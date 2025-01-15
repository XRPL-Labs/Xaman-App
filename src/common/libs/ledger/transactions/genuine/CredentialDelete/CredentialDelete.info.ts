import Localize from '@locale';

import { AccountModel } from '@store/models';

import CredentialDelete from './CredentialDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class CredentialDeleteInfo extends ExplainerAbstract<CredentialDelete, MutationsMixinType> {
    constructor(item: CredentialDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.credentialDelete');
    }

    generateDescription(): string {
        return `This is an ${this.item.Type} transaction`;
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Issuer, tag: undefined },
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
export default CredentialDeleteInfo;
