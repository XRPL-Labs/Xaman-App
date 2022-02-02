import BigNumber from 'bignumber.js';
import { has } from 'lodash';

import {
    LiquidityCheck,
    Params as LiquidityCheckParams,
    Result as LiquidityResult,
    RatesInCurrency,
    Errors,
    Options,
} from 'xrpl-orderbook-reader';

import Localize from '@locale';

import { ApiService, SocketService } from '@services';

import { ValueToIOU } from '@common/utils/amount';
/* types ==================================================================== */
export enum MarketDirection {
    SELL = 'SELL',
    BUY = 'BUY',
}

export type ExchangePair = {
    currency: string;
    issuer?: string;
};

/* Constants ==================================================================== */
const MAX_XRP_DECIMAL_PLACES = 6;
const MAX_IOU_DECIMAL_PLACES = 8;

/* Class ==================================================================== */
class LedgerExchange {
    private liquidityCheck: LiquidityCheck;
    private pair: ExchangePair;
    public boundaryOptions: Options;
    public errors: any;

    constructor(pair: ExchangePair) {
        this.pair = pair;
        this.liquidityCheck = undefined;

        this.boundaryOptions = {
            rates: RatesInCurrency.to,
            timeoutSeconds: 10,
            maxSpreadPercentage: 4,
            maxSlippagePercentage: 3,
            maxSlippagePercentageReverse: 3,
        };

        this.errors = {
            [Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE]: Localize.t('exchange.requestedLiquidityNotAvailable'),
            [Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE]: Localize.t('exchange.reverseLiquidityNotAvailable'),
            [Errors.MAX_SPREAD_EXCEEDED]: Localize.t('exchange.maxSpreadExceeded'),
            [Errors.MAX_SLIPPAGE_EXCEEDED]: Localize.t('exchange.maxSlippageExceeded'),
            [Errors.MAX_REVERSE_SLIPPAGE_EXCEEDED]: Localize.t('exchange.maxReverseSlippageExceeded'),
        };
    }

    initialize = (direction: MarketDirection) => {
        // fetch liquidity boundaries
        return ApiService.liquidityBoundaries
            .get({
                issuer: this.pair.issuer,
                currency: this.pair.currency,
            })
            .then((res: any) => {
                if (res && has(res, 'options')) {
                    this.boundaryOptions = res.options;
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                // build default params
                const params = this.getLiquidityCheckParams(direction, 0);
                this.liquidityCheck = new LiquidityCheck(params);
            });
    };

    calculateOutcomes = (value: string, liquidity: LiquidityResult, direction: MarketDirection) => {
        if (!value || value === '0' || !liquidity.rate) {
            return {
                expected: '0',
                minimum: '0',
            };
        }

        const decimalPlaces = direction === MarketDirection.SELL ? MAX_IOU_DECIMAL_PLACES : MAX_XRP_DECIMAL_PLACES;

        const { maxSlippagePercentage } = this.boundaryOptions;
        const amount = new BigNumber(value);

        // expected outcome base on liquidity rate
        let expected = amount.multipliedBy(liquidity.rate).decimalPlaces(decimalPlaces).toString(10);
        // calculate padded exchange rate base on maxSlippagePercentage
        const paddedExchangeRate = new BigNumber(liquidity.rate).dividedBy(
            new BigNumber(100).plus(maxSlippagePercentage).dividedBy(100),
        );

        // calculate minimum value
        let minimum = amount.multipliedBy(paddedExchangeRate).decimalPlaces(decimalPlaces).toString(10);

        // fix the precision for IOU values if more than MAX_IOU_PRECISION
        if (direction === MarketDirection.SELL) {
            minimum = ValueToIOU(minimum);
            expected = ValueToIOU(expected);
        }

        return {
            expected,
            minimum,
        };
    };

    calculateExchangeRate = (liquidity: LiquidityResult, direction: MarketDirection): string => {
        return direction === MarketDirection.SELL
            ? new BigNumber(liquidity.rate).decimalPlaces(3).toString(10)
            : new BigNumber(1).dividedBy(liquidity.rate).decimalPlaces(3).toString(10);
    };

    getLiquidityCheckParams = (direction: MarketDirection, amount: number): LiquidityCheckParams => {
        const pair = {
            currency: this.pair.currency,
            issuer: this.pair.issuer,
        };

        const from = direction === MarketDirection.SELL ? { currency: 'XRP' } : pair;
        const to = direction === MarketDirection.SELL ? pair : { currency: 'XRP' };

        return {
            trade: {
                from,
                to,
                amount,
            },
            options: this.boundaryOptions,
            method: SocketService.send,
        };
    };

    getLiquidity = (direction: MarketDirection, amount: number): Promise<LiquidityResult> => {
        try {
            const params = this.getLiquidityCheckParams(direction, amount);

            if (this.liquidityCheck) {
                // update params
                this.liquidityCheck.refresh(params);

                return this.liquidityCheck.get();
            }
            return Promise.reject(new Error('Liquidity check is not initialized yet!'));
        } catch (e) {
            return Promise.reject(e);
        }
    };
}

export default LedgerExchange;
