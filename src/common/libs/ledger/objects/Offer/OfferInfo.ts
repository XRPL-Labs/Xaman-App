import Localize from '@locale';

import { OfferCreateInfo } from '@common/libs/ledger/transactions/genuine/OfferCreate';

import Offer from '@common/libs/ledger/objects/Offer/OfferClass';

/* Descriptor ==================================================================== */
const OfferInfo = {
    getLabel: (): string => {
        return Localize.t('global.offer');
    },

    getDescription: OfferCreateInfo.getDescription,

    getRecipient: (object: Offer) => {
        return object.Account;
    },
};

/* Export ==================================================================== */
export default OfferInfo;
