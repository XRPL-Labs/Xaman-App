import { AccountModel } from '@store/models';

import Localize from '@locale';

import OfferCancel from './OfferCancelClass';

/* Descriptor ==================================================================== */
const OfferCancelInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelOffer');
    },

    getDescription: (tx: OfferCancel): string => {
        return Localize.t('events.theTransactionWillCancelOffer', {
            address: tx.Account.address,
            offerSequence: tx.OfferSequence,
        });
    },

    getRecipient: (tx: OfferCancel, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default OfferCancelInfo;
