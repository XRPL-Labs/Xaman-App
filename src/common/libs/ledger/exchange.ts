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
/* types ==================================================================== */
export type ExchangePair = {
    currency: string;
    issuer?: string;
};

/* Class ==================================================================== */
class LedgerExchange {
    private liquidityCheck: LiquidityCheck;
    private pair: ExchangePair;
    public boundaryOptions: Options;
    public errors: any;

    constructor(pair: ExchangePair) {
        this.pair = pair;

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

    initialize = () => {
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
                const params = this.getLiquidityCheckParams('sell', 0);

                this.liquidityCheck = new LiquidityCheck(params);
            });
    };

    getLiquidityCheckParams = (direction: 'sell' | 'buy', amount: number): LiquidityCheckParams => {
        const pair = {
            currency: this.pair.currency,
            issuer: this.pair.issuer,
        };

        const from = direction === 'sell' ? { currency: 'XRP' } : pair;
        const to = direction === 'sell' ? pair : { currency: 'XRP' };

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

    getLiquidity = (direction: 'sell' | 'buy', amount: number): Promise<LiquidityResult> => {
        const params = this.getLiquidityCheckParams(direction, amount);

        if (this.liquidityCheck) {
            // update params
            this.liquidityCheck.refresh(params);

            return this.liquidityCheck.get();
        }
        return undefined;
    };
}

export default LedgerExchange;
