import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenCancelSellOffer from './URITokenCancelSellOfferClass';

/* Descriptor ==================================================================== */
const URITokenCancelSellOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelURITokenSellOffer');
    },

    getDescription: (tx: URITokenCancelSellOffer): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: URITokenCancelSellOffer, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default URITokenCancelSellOfferInfo;
