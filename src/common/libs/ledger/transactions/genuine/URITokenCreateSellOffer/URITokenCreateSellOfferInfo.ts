import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenCreateSellOffer from './URITokenCreateSellOfferClass';

/* Descriptor ==================================================================== */
const URITokenCreateSellOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.createURITokenSellOffer');
    },

    getDescription: (tx: URITokenCreateSellOffer): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: URITokenCreateSellOffer, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenCreateSellOfferInfo;
