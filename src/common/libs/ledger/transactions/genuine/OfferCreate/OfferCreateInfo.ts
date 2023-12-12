import { isUndefined } from 'lodash';
import moment from 'moment-timezone';

import NetworkService from '@services/NetworkService';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { OfferStatus } from '@common/libs/ledger/parser/types';

import Localize from '@locale';

import OfferCreate from './OfferCreateClass';

/* Descriptor ==================================================================== */
const OfferCreateInfo = {
    getLabel: (tx: OfferCreate, account: AccountModel): string => {
        if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].includes(tx.GetOfferStatus(account.address))) {
            return Localize.t('events.exchangedAssets');
        }
        return Localize.t('events.createOffer');
    },

    getDescription: (tx: OfferCreate): string => {
        let content = '';

        content = Localize.t('events.offerTransactionExplain', {
            address: tx.Account.address,
            takerGetsValue: tx.TakerGets.value,
            takerGetsCurrency: NormalizeCurrencyCode(tx.TakerGets.currency),
            takerPaysValue: tx.TakerPays.value,
            takerPaysCurrency: NormalizeCurrencyCode(tx.TakerPays.currency),
        });

        content += '\n';
        content += Localize.t('events.theExchangeRateForThisOfferIs', {
            rate: tx.Rate,
            takerPaysCurrency:
                tx.TakerGets.currency === NetworkService.getNativeAsset()
                    ? NormalizeCurrencyCode(tx.TakerPays.currency)
                    : NormalizeCurrencyCode(tx.TakerGets.currency),
            takerGetsCurrency:
                tx.TakerGets.currency !== NetworkService.getNativeAsset()
                    ? NormalizeCurrencyCode(tx.TakerPays.currency)
                    : NormalizeCurrencyCode(tx.TakerGets.currency),
        });

        if (!isUndefined(tx.OfferSequence)) {
            content += '\n';
            content += Localize.t('events.theTransactionIsAlsoCancelOffer', {
                address: tx.Account.address,
                offerSequence: tx.OfferSequence,
            });
        }

        if (!isUndefined(tx.OfferID)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasAOfferId', { offerId: tx.OfferID });
        }

        if (tx.Expiration) {
            content += '\n';
            content += Localize.t('events.theOfferExpiresAtUnlessCanceledOrConsumed', {
                expiration: moment(tx.Expiration).format('LLLL'),
            });
        }

        return content;
    },

    getRecipient: (tx: OfferCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default OfferCreateInfo;
