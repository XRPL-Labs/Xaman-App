import { isUndefined } from 'lodash';
import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import URITokenMint from './URITokenMintClass';

/* Descriptor ==================================================================== */
const URITokenMintInfo = {
    getLabel: (): string => {
        return Localize.t('events.mintURIToken');
    },

    getDescription: (tx: URITokenMint): string => {
        const { URI, Digest, Amount, Destination } = tx;

        let content = Localize.t('events.theURIForThisTokenIs', { uri: URI });

        if (!isUndefined(Digest)) {
            content += '\n';
            content += Localize.t('events.theTokenHasADigest', { digest: Digest });
        }

        if (!isUndefined(Amount)) {
            content += '\n';
            content += Localize.t('events.uriTokenMintAmount', {
                value: Amount.value,
                currency: NormalizeCurrencyCode(Amount.currency),
            });
        }

        if (!isUndefined(Destination)) {
            content += '\n';
            content += Localize.t('events.uriTokenDestinationExplain', {
                address: Destination.address,
            });
        }

        return content;
    },

    getRecipient: (tx: URITokenMint, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenMintInfo;
