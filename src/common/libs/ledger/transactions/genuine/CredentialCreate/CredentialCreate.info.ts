import Localize from '@locale';

import { AccountModel } from '@store/models';

import CredentialCreate from './CredentialCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { HexEncoding } from '@common/utils/string';

/* Descriptor ==================================================================== */
class CredentialCreateInfo extends ExplainerAbstract<CredentialCreate, MutationsMixinType> {
    constructor(item: CredentialCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.credentialCreate');
    }

    generateDescription(): string {
        let msg = Localize.t('txCredentialSet.thisIsA', {
            type: this.item.Type,
        });

        msg += Localize.t('txCredentialSet.itInvolvesIssuesACredentialTo', {
            from: this.item.Account,
            to: this.item.Subject,
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

        const decodedUri = HexEncoding.displayHex(this.item?.URI);

        let uri = this.item?.URI || 'N/A';
        if (this.item?.URI && decodedUri !== this.item?.URI) {
            uri = decodedUri;
        }

        msg += Localize.t('txCredentialSet.theCredentialUriIs', {
            uri,
        });

        return msg;
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
