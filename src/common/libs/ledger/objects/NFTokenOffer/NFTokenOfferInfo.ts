import moment from 'moment-timezone';
import Localize from '@locale';

import { AccountModel } from '@store/models/objects';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import NFTokenOffer from '@common/libs/ledger/objects/NFTokenOffer/NFTokenOfferClass';

/* Descriptor ==================================================================== */
const NFTokenOfferInfo = {
    getLabel: (object: NFTokenOffer, account: AccountModel): string => {
        // incoming offers
        if (object.Owner !== account.address) {
            if (object.Flags.SellToken) {
                return Localize.t('events.nftOfferedToYou');
            }
            return Localize.t('events.offerOnYouNFT');
        }
        // outgoing offers
        if (object.Flags.SellToken) {
            return Localize.t('events.sellNFToken');
        }
        return Localize.t('events.buyNFToken');
    },

    getDescription: (object: NFTokenOffer): string => {
        let content = '';

        if (object.Flags.SellToken) {
            content += Localize.t('events.nftOfferSellExplain', {
                address: object.Owner,
                tokenID: object.NFTokenID,
                amount: object.Amount.value,
                currency: NormalizeCurrencyCode(object.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftOfferBuyExplain', {
                address: object.Owner,
                tokenID: object.NFTokenID,
                amount: object.Amount.value,
                currency: NormalizeCurrencyCode(object.Amount.currency),
            });
        }

        if (object.Destination) {
            content += '\n';
            content += Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: object.Destination.address });
        }

        if (object.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                expiration: moment(object.Expiration).format('LLLL'),
            });
        }

        return content;
    },

    getRecipient: (object: NFTokenOffer) => {
        return {
            address: object.Owner,
        };
    },
};

/* Export ==================================================================== */
export default NFTokenOfferInfo;
