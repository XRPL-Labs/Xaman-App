import Localize from '@locale';

import { AccountModel } from '@store/models';

import CredentialDelete from './CredentialDelete.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { HexEncoding } from '@common/utils/string';

/* Descriptor ==================================================================== */
class CredentialDeleteInfo extends ExplainerAbstract<CredentialDelete, MutationsMixinType> {
    constructor(item: CredentialDelete & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.credentialDelete');
    }

    generateDescription(): string {
        let msg = Localize.t('txCredentialSet.thisIsA', {
            type: this.item.Type,
        });

        msg += Localize.t('txCredentialSet.itInvolvesIssuesACredentialFrom', {
            from: this.item.Issuer,
        });

        msg += '\n\n';

        const decodedType = HexEncoding.displayHex(this.item?.CredentialType);

        let type = this.item?.CredentialType || 'N/A';
        if (this.item?.CredentialType && decodedType !== this.item?.CredentialType && decodedType.length < 15) {
            type = decodedType;
        }

        msg += Localize.t('txCredentialSet.theCredentialTypeIs', {
            type,
        });

        return msg;
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
