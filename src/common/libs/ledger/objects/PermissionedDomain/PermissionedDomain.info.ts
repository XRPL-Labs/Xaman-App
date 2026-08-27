import Localize from '@locale';

import { AccountModel } from '@store/models';

import PermissionedDomain from '@common/libs/ledger/objects/PermissionedDomain/PermissionedDomain.class';

/* Types ==================================================================== */
import { AssetDetails, ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
// import { NormalizeCurrencyCode } from '@common/utils/monetary';

/* Descriptor ==================================================================== */
class PermissionedDomainInfo extends ExplainerAbstract<PermissionedDomain> {
    constructor(item: PermissionedDomain, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('permissionedDomain.title');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(Localize.t('permissionedDomain.eventThisIsA'));

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Owner, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [];
    }
}

/* Export ==================================================================== */
export default PermissionedDomainInfo;
