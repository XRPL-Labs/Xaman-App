import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenBuy from './URITokenBuyClass';

/* Descriptor ==================================================================== */
const URITokenBuyInfo = {
    getLabel: (): string => {
        return Localize.t('events.buyURIToken');
    },

    getDescription: (tx: URITokenBuy): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: URITokenBuy, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenBuyInfo;
