import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenBurn from './URITokenBurnClass';

/* Descriptor ==================================================================== */
const URITokenBurnInfo = {
    getLabel: (): string => {
        return Localize.t('events.burnURIToken');
    },

    getDescription: (tx: URITokenBurn): string => {
        const { URITokenID } = tx;

        return Localize.t('events.uriTokenBurnExplain', { tokenID: URITokenID });
    },

    getRecipient: (tx: URITokenBurn, account: AccountModel): { address: string; tag?: number } => {
        const { Account } = tx;

        if (Account.address !== account.address) {
            return Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenBurnInfo;
