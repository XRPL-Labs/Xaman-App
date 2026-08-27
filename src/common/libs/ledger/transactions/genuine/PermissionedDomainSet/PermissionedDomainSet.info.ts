import Localize from '@locale';

import { AccountModel } from '@store/models';

import PermissionedDomainSet from './PermissionedDomainSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class PermissionedDomainSetInfo extends ExplainerAbstract<PermissionedDomainSet, MutationsMixinType> {
    constructor(item: PermissionedDomainSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (this.item.DomainID) {
            return Localize.t('permissionedDomain.setTitleUpdate');
        }

        return Localize.t('permissionedDomain.setTitleCreate');
    }

    generateDescription(): string {
        const content = [];

        if (this.item.DomainID) {
            content.push(Localize.t('permissionedDomain.txThisUpdates'));
            content.push(Localize.t('permissionedDomain.theDomainIdIs', { domainId: this.item.DomainID }));
        } else {
            content.push(Localize.t('permissionedDomain.txThisCreates'));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            // end: { address: this.item.Authorize || this.item.Unauthorize, tag: undefined },
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
export default PermissionedDomainSetInfo;
