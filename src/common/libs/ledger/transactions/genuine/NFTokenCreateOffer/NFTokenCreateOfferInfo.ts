import moment from 'moment-timezone';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import NFTokenCreateOffer from './NFTokenCreateOfferClass';

/* Descriptor ==================================================================== */
const NFTokenCreateOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.createNFTOffer');
    },

    getDescription: (tx: NFTokenCreateOffer): string => {
        let content = '';

        if (tx.Flags.SellToken) {
            content += Localize.t('events.nftOfferSellExplain', {
                address: tx.Account.address,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftOfferBuyExplain', {
                address: tx.Account.address,
                tokenID: tx.NFTokenID,
                amount: tx.Amount.value,
                currency: NormalizeCurrencyCode(tx.Amount.currency),
            });
        }

        if (tx.Owner) {
            content += '\n';
            content += Localize.t('events.theNftOwnerIs', { address: tx.Owner });
        }

        if (tx.Destination) {
            content += '\n';
            content += Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: tx.Destination.address });
        }

        if (tx.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                expiration: moment(tx.Expiration).format('LLLL'),
            });
        }

        return content;
    },

    getRecipient: (tx: NFTokenCreateOffer, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default NFTokenCreateOfferInfo;
