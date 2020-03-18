import { get } from 'lodash';
import BigNumber from 'bignumber.js';

import { LedgerService } from '@services';

/* types ==================================================================== */
export type ExchangePair = {
    currency: string;
    issuer?: string;
};

/* Class ==================================================================== */
class LedgerExchange {
    private pair: ExchangePair;
    private offersSell: Array<any>;
    private offersBuy: Array<any>;

    constructor(pair: ExchangePair) {
        this.pair = pair;
    }

    sync = async () => {
        // sell XRP orderBook
        const orderBookSell = await LedgerService.getOffers({
            limit: 10,
            taker_pays: { currency: 'XRP' },
            taker_gets: this.pair,
        });

        // buy XRP orderBook
        const orderBookBuy = await LedgerService.getOffers({
            limit: 10,
            taker_pays: this.pair,
            taker_gets: { currency: 'XRP' },
        });

        this.offersSell = get(orderBookSell, 'offers', []);
        this.offersBuy = get(orderBookBuy, 'offers', []);
    };

    liquidityGrade = (direction: 'sell' | 'buy'): number => {
        let enoughLiquidity = 2;

        const offers = direction === 'sell' ? this.offersSell : this.offersBuy;

        // check for liquidity
        // not much offer is the orderBook
        if (offers.length < 10) {
            enoughLiquidity = 0;
        } else {
            const firstOffer = new BigNumber(offers[0].quality);
            const lastOffer = new BigNumber(offers[9].quality);

            const diffPercent = lastOffer
                .dividedBy(firstOffer)
                .multipliedBy(100)
                .minus(100)
                .toNumber();

            if (diffPercent > 20) {
                enoughLiquidity = 0;
            } else if (diffPercent > 10) {
                // liquidityIsNotSoMuch
                enoughLiquidity = 1;
            }
        }

        // 2 liquidity is looks good
        // 1 not enough but OK
        // 0 not enough liquidity
        return enoughLiquidity;
    };

    getExchangeRate = (direction: 'sell' | 'buy'): number => {
        const offers = direction === 'sell' ? this.offersSell : this.offersBuy;

        if (this.liquidityGrade(direction) === 0) {
            return 0;
        }

        const offerRates = offers.map((o: any) => {
            const quality = new BigNumber(o.quality);
            if (direction === 'sell') {
                return new BigNumber(1).dividedBy(quality.dividedBy(1000000));
            }
            return quality.multipliedBy(1000000);
        });

        // const bestRate = offerRates.slice(-1)[0];
        const bestRate = offerRates[0];

        return bestRate.decimalPlaces(6).toNumber();
    };
}

export default LedgerExchange;
