import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenCancelSellOffer from './URITokenCancelSellOfferClass';

/* Descriptor ==================================================================== */
const URITokenCancelSellOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelURITokenSellOffer');
    },

    getDescription: (tx: URITokenCancelSellOffer): string => {
        const { Account, URITokenID } = tx;

        return Localize.t('events.theTransactionWillCancelURITokenOffer', {
            address: Account.address,
            tokenId: URITokenID,
        });
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
