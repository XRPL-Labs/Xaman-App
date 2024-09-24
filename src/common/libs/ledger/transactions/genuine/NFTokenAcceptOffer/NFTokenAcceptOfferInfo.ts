import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import NFTokenAcceptOffer from './NFTokenAcceptOfferClass';

/* Descriptor ==================================================================== */
const NFTokenAcceptOfferInfo = {
    getLabel: (): string => {
        return Localize.t('events.acceptNFTOffer');
    },

    getDescription: (tx: NFTokenAcceptOffer): string => {
        const offerID = tx.NFTokenBuyOffer || tx.NFTokenSellOffer;

        // this should never happen
        // but as we are in beta we should check
        if (!tx.Offer) {
            return 'Unable to fetch the offer for this transaction!';
        }

        let content = '';

        if (tx.Offer.Flags.SellToken) {
            content += Localize.t('events.nftAcceptOfferBuyExplanation', {
                address: tx.Account.address,
                offerID,
                tokenID: tx.Offer.NFTokenID,
                amount: tx.Offer.Amount.value,
                currency: NormalizeCurrencyCode(tx.Offer.Amount.currency),
            });
        } else {
            content += Localize.t('events.nftAcceptOfferSellExplanation', {
                address: tx.Account.address,
                offerID,
                tokenID: tx.Offer.NFTokenID,
                amount: tx.Offer.Amount.value,
                currency: NormalizeCurrencyCode(tx.Offer.Amount.currency),
            });
        }

        if (tx.NFTokenBrokerFee) {
            content += '\n';
            content += Localize.t('events.nftAcceptOfferBrokerFee', {
                brokerFee: tx.NFTokenBrokerFee.value,
                currency: NormalizeCurrencyCode(tx.NFTokenBrokerFee.currency),
            });
        }

        return content;
    },

    getRecipient: (tx: NFTokenAcceptOffer, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        if (tx.Offer) {
            return { address: tx.Offer.Owner };
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default NFTokenAcceptOfferInfo;
