import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenBurn from './URITokenBurnClass';

/* Descriptor ==================================================================== */
const URITokenBurnInfo = {
    getLabel: (): string => {
        return Localize.t('events.burnURIToken');
    },

    getDescription: (tx: URITokenBurn): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: URITokenBurn, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenBurnInfo;
