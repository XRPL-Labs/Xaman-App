import { AccountModel } from '@store/models';

import Localize from '@locale';

import NFTokenCancelOffer from './NFTokenCancelOfferClass';

/* Descriptor ==================================================================== */
const NFTokenCancelOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelNFTOffer');
    },

    getDescription: (tx: NFTokenCancelOffer): string => {
        let content = '';

        content += Localize.t('events.theTransactionWillCancelNftOffer', { address: tx.Account.address });
        content += '\n';

        tx.NFTokenOffers?.forEach((id: string) => {
            content += `${id}\n`;
        });

        return content;
    },

    getRecipient: (tx: NFTokenCancelOffer, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default NFTokenCancelOfferInfo;
