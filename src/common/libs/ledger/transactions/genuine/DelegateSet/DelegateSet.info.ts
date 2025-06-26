import Localize from '@locale';

import { AccountModel } from '@store/models';

import DelegateSet from './DelegateSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class DelegateSetInfo extends ExplainerAbstract<DelegateSet, MutationsMixinType> {
    constructor(item: DelegateSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (this.item.Authorize) {
            return Localize.t('txDelegateSet.delegateSet');
        }
        return Localize.t('txDelegateSet.removeAuthorize');
    }

    generateDescription(): string {
        const { Authorize } = this.item;

        const content: string[] = [Localize.t('txDelegateSet.thisIsAnDelegateSetTransaction')];

        if (Authorize && this.item?.Permissions && this.item.Permissions.length > 0) {
            content.push(Localize.t('txDelegateSet.itSetsAccountAuthorizeTo', { authorize: Authorize }));

            content.push(
                Localize.t('txDelegateSet.itSetsThesePermissions', {
                    permissions: `\n\n - ${this.item.___translatedDelegations.join('\n - ')}`,
                }),
            );
        }

        if (Authorize && (!this.item?.Permissions || this.item.Permissions.length === 0)) {
            content.push(Localize.t('txDelegateSet.itRemoves', { authorize: Authorize }));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.Authorize ? { address: this.item.Authorize, tag: undefined } : undefined,
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
export default DelegateSetInfo;
