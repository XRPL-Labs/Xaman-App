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

import NetworkService from '@services/NetworkService';
import BackendService from '@services/BackendService';

import { ValueToIOU } from '@common/utils/monetary';
import { IssuedCurrency } from '@common/libs/ledger/types/common';

/* types ==================================================================== */
export enum MarketDirection {
    SELL = 'SELL',
    BUY = 'BUY',
}

/* Constants ==================================================================== */
const MAX_NATIVE_DECIMAL_PLACES = 6;
const MAX_IOU_DECIMAL_PLACES = 8;

const TIMEOUT_SECONDS = 10;
const MAX_SPREAD_PERCENTAGE = 4;
const MAX_SLIPPAGE_PERCENTAGE = 3;
const MAX_SLIPPAGE_PERCENTAGE_REVERSE = 3;
/* Class ==================================================================== */
class LedgerExchange {
    private liquidityCheck: LiquidityCheck | undefined;
    private pair: IssuedCurrency;
    public boundaryOptions: Options;
    public errors: {
        [Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE]: string;
        [Errors.MAX_SLIPPAGE_EXCEEDED]: string;
        [Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE]: string;
        [Errors.MAX_REVERSE_SLIPPAGE_EXCEEDED]: string;
        [Errors.MAX_SPREAD_EXCEEDED]: string;
    };

    constructor(pair: IssuedCurrency) {
        this.pair = pair;
        this.liquidityCheck = undefined;

        // craft default boundary options
        this.boundaryOptions = {
            rates: RatesInCurrency.to,
            timeoutSeconds: TIMEOUT_SECONDS,
            maxSpreadPercentage: MAX_SPREAD_PERCENTAGE,
            maxSlippagePercentage: MAX_SLIPPAGE_PERCENTAGE,
            maxSlippagePercentageReverse: MAX_SLIPPAGE_PERCENTAGE_REVERSE,
        };

        this.errors = {
            [Errors.REQUESTED_LIQUIDITY_NOT_AVAILABLE]: Localize.t('exchange.requestedLiquidityNotAvailable'),
            [Errors.REVERSE_LIQUIDITY_NOT_AVAILABLE]: Localize.t('exchange.reverseLiquidityNotAvailable'),
            [Errors.MAX_SPREAD_EXCEEDED]: Localize.t('exchange.maxSpreadExceeded'),
            [Errors.MAX_SLIPPAGE_EXCEEDED]: Localize.t('exchange.maxSlippageExceeded'),
            [Errors.MAX_REVERSE_SLIPPAGE_EXCEEDED]: Localize.t('exchange.maxReverseSlippageExceeded'),
        };
    }

    initialize = async (direction: MarketDirection) => {
        // fetch liquidity boundaries
        return BackendService.getLiquidityBoundaries(this.pair.issuer, this.pair.currency)
            .then((res) => {
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

        const decimalPlaces = direction === MarketDirection.SELL ? MAX_IOU_DECIMAL_PLACES : MAX_NATIVE_DECIMAL_PLACES;

        const { maxSlippagePercentage = MAX_SLIPPAGE_PERCENTAGE } = this.boundaryOptions;
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

        const from = direction === MarketDirection.SELL ? { currency: NetworkService.getNativeAsset() } : pair;
        const to = direction === MarketDirection.SELL ? pair : { currency: NetworkService.getNativeAsset() };

        return {
            trade: {
                from,
                to,
                amount,
            },
            options: this.boundaryOptions,
            method: NetworkService.send,
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
