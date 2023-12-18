import { isUndefined } from 'lodash';
import { AccountModel } from '@store/models';

import Localize from '@locale';

import URITokenCreateSellOffer from './URITokenCreateSellOfferClass';

/* Descriptor ==================================================================== */
const URITokenCreateSellOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.createURITokenSellOffer');
    },

    getDescription: (tx: URITokenCreateSellOffer): string => {
        const { Account, URITokenID, Destination, Amount } = tx;

        let content = Localize.t('events.uriTokenSellOfferExplain', {
            address: Account.address,
            uriToken: URITokenID,
            value: Amount.value,
            currency: Amount.currency,
        });

        if (!isUndefined(Destination)) {
            content += '\n';
            content += Localize.t('events.thisURITokenOfferMayOnlyBeAcceptedBy', {
                address: Destination.address,
            });
        }

        return content;
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
