import Localize from '@locale';

import { AccountModel } from '@store/models';

import PermissionedDomainDelete from './PermissionedDomainDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class PermissionedDomainDeleteInfo extends ExplainerAbstract<PermissionedDomainDelete, MutationsMixinType> {
    constructor(item: PermissionedDomainDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('permissionedDomain.remove');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('permissionedDomain.thisTxRemovesDomainId', { domainId: this.item.DomainID }));

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
export default PermissionedDomainDeleteInfo;
