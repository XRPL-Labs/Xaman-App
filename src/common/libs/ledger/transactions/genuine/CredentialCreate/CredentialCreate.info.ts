import Localize from '@locale';

import { AccountModel } from '@store/models';

import CredentialCreate from './CredentialCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class CredentialCreateInfo extends ExplainerAbstract<CredentialCreate, MutationsMixinType> {
    constructor(item: CredentialCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.credentialCreate');
    }

    generateDescription(): string {
        return `This is an ${this.item.Type} transaction`;
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Subject, tag: undefined },
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
export default CredentialCreateInfo;
