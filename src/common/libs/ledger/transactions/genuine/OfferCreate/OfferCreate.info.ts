import moment from 'moment-timezone';

import NetworkService from '@services/NetworkService';

import { AccountModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { OfferStatus } from '@common/libs/ledger/parser/types';

import Localize from '@locale';

import OfferCreate from './OfferCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */

class OfferCreateInfo extends ExplainerAbstract<OfferCreate> {
    constructor(item: OfferCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (
            [OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].includes(this.item.GetOfferStatus(this.account.address))
        ) {
            return Localize.t('events.exchangedAssets');
        }
        return Localize.t('events.createOffer');
    }

    generateDescription(): string {
        const content: string[] = [];

        content.push(
            Localize.t('events.offerTransactionExplain', {
                address: this.item.Account,
                takerGetsValue: this.item.TakerGets!.value,
                takerGetsCurrency: NormalizeCurrencyCode(this.item.TakerGets!.currency),
                takerPaysValue: this.item.TakerPays!.value,
                takerPaysCurrency: NormalizeCurrencyCode(this.item.TakerPays!.currency),
            }),
        );

        content.push(
            Localize.t('events.theExchangeRateForThisOfferIs', {
                rate: this.item.Rate,
                takerPaysCurrency:
                    this.item.TakerGets!.currency === NetworkService.getNativeAsset()
                        ? NormalizeCurrencyCode(this.item.TakerPays!.currency)
                        : NormalizeCurrencyCode(this.item.TakerGets!.currency),
                takerGetsCurrency:
                    this.item.TakerGets!.currency !== NetworkService.getNativeAsset()
                        ? NormalizeCurrencyCode(this.item.TakerPays!.currency)
                        : NormalizeCurrencyCode(this.item.TakerGets!.currency),
            }),
        );

        if (typeof this.item.OfferSequence !== 'undefined') {
            content.push(
                Localize.t('events.theTransactionIsAlsoCancelOffer', {
                    address: this.item.Account,
                    offerSequence: this.item.OfferSequence,
                }),
            );
        }

        if (typeof this.item.OfferID !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasAOfferId', { offerId: this.item.OfferID }));
        }

        if (typeof this.item.Expiration !== 'undefined') {
            content.push(
                Localize.t('events.theOfferExpiresAtUnlessCanceledOrConsumed', {
                    expiration: moment(this.item.Expiration).format('LLLL'),
                }),
            );
        }

        return content.join('\n');
    }

    // TODO: hide participants if async offer https://github.com/XRPL-Labs/Xaman-Issue-Tracker/issues/260
    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.TakerPays!.currency,
                value: this.item.TakerPays!.value,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default OfferCreateInfo;
