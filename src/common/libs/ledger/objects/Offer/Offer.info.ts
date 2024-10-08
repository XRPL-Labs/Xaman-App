import moment from 'moment-timezone';

import Localize from '@locale';

import NetworkService from '@services/NetworkService';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import Offer from './Offer.class';

/* Types ==================================================================== */
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class OfferInfo extends ExplainerAbstract<Offer> {
    constructor(item: Offer, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('global.offer');
    }

    generateDescription(): string {
        const { Account, TakerGets, TakerPays, Rate, OfferSequence, OfferID, Expiration } = this.item;

        const content: string[] = [];

        content.push(
            Localize.t('events.offerTransactionExplain', {
                address: Account,
                takerGetsValue: TakerGets!.value,
                takerGetsCurrency: NormalizeCurrencyCode(TakerGets!.currency),
                takerPaysValue: TakerPays!.value,
                takerPaysCurrency: NormalizeCurrencyCode(TakerPays!.currency),
            }),
        );

        content.push(
            Localize.t('events.theExchangeRateForThisOfferIs', {
                rate: Rate,
                takerPaysCurrency:
                    TakerGets!.currency === NetworkService.getNativeAsset()
                        ? NormalizeCurrencyCode(TakerPays!.currency)
                        : NormalizeCurrencyCode(TakerGets!.currency),
                takerGetsCurrency:
                    TakerGets!.currency !== NetworkService.getNativeAsset()
                        ? NormalizeCurrencyCode(TakerPays!.currency)
                        : NormalizeCurrencyCode(TakerGets!.currency),
            }),
        );

        if (typeof OfferSequence !== 'undefined') {
            content.push(
                Localize.t('events.theTransactionIsAlsoCancelOffer', {
                    address: Account,
                    offerSequence: OfferSequence,
                }),
            );
        }

        if (typeof OfferID !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasAOfferId', { offerId: OfferID }));
        }

        if (typeof Expiration !== 'undefined') {
            content.push(
                Localize.t('events.theOfferExpiresAtUnlessCanceledOrConsumed', {
                    expiration: moment(Expiration).format('LLLL'),
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor: [
                {
                    ...this.item.TakerPays!,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: OperationActions.INC,
                },
                {
                    ...this.item.TakerGets!,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: OperationActions.DEC,
                },
            ],
        };
    }
}

/* Export ==================================================================== */
export default OfferInfo;
