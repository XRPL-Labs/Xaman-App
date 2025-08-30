import Localize from '@locale';

import { AccountModel } from '@store/models';

import Delegate from './Delegate.class';

/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
import NetworkService from '@services/NetworkService';

/* Descriptor ==================================================================== */
class DelegateInfo extends ExplainerAbstract<Delegate> {
    constructor(item: Delegate, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('txDelegateSet.objectLabel');
        // return `SomeDelegationLabel`;
    }

    generateDescription(): string {
        const transactionDefinitions = NetworkService.getRawNetworkDefinitions()?.TRANSACTION_TYPES || {};

        let msg = Localize.t('txDelegateSet.itSetsAccountAuthorizeTo', {
            authorize: this.item.Authorize,
        });

        msg += '\n\n';

        const perms = (this.item.Permissions || []).map((p) => {
            const matchingTx = Object.keys(transactionDefinitions).filter(
                (v) => transactionDefinitions[v] === p?.Permission?.PermissionValue,
            )?.[0];

            if (matchingTx) return matchingTx;

            return p?.Permission?.PermissionValue;
        });

        msg += Localize.t('txDelegateSet.itSetsThesePermissions', {
            permissions: `\n\n- ${perms.join('\n -')}`,
        });

        return msg;
    }

    getParticipants() {
        return {
            start: { address: this.item.Authorize, tag: undefined },
            end: { address: this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default DelegateInfo;
