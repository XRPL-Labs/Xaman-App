import Localize from '@locale';

import { AccountModel } from '@store/models';

import Credential from './Credential.class';

/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';
// import NetworkService from '@services/NetworkService';
import { HexEncoding } from '@common/utils/string';

/* Descriptor ==================================================================== */
class CredentialInfo extends ExplainerAbstract<Credential> {
    constructor(item: Credential, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        const decodedType = HexEncoding.displayHex(this.item?.CredentialType);

        let type = '';
        if (this.item?.CredentialType && decodedType !== this.item?.CredentialType && decodedType.length < 15) {
            type = ` (${decodedType})`;
        }
        // return Localize.t('txCredentialSet.objectLabel');
        // console.log(this.item.Flags, this.item.Issuer, this.item.Subject, this.account.address);
        if (!this.item.Flags?.lsfAccepted) {
            return `${Localize.t('events.credentialOffered')}${type}`;
        }

        return `${Localize.t('events.credential')}${type}`;
    }

    generateDescription(): string {
        // const transactionDefinitions = NetworkService.getRawNetworkDefinitions()?.TRANSACTION_TYPES || {};

        let msg = Localize.t('txCredentialSet.itInvolvesIssuesACredentialTo', {
            from: this.item.Issuer,
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
            start: {
                address: this.item.Issuer,
                tag: undefined,
            },
            end: {
                address: this.item.Subject,
                tag: undefined,
            },
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
export default CredentialInfo;
