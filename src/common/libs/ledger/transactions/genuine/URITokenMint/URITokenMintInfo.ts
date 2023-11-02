import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenMint from './URITokenMintClass';

/* Descriptor ==================================================================== */
const URITokenMintInfo = {
    getLabel: (): string => {
        return Localize.t('events.mintURIToken');
    },

    getDescription: (tx: URITokenMint): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
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
