import BigNumber from 'bignumber.js';

/* Codec ==================================================================== */
export const TradingFee = {
    decode: (_self: any, value: number): number => {
        const tradingFee = new BigNumber(value);

        if (tradingFee.isZero()) {
            return 0;
        }

        return tradingFee.dividedBy(1000).toNumber();
    },

    encode: (_self: any, value: number): number => {
        const tradingFee = new BigNumber(value).multipliedBy(1000);

        if (tradingFee.isGreaterThan(1000) || tradingFee.isLessThan(0)) {
            throw new Error('TradingFee value cannot be more than 1% or less than 0%');
        }

        return tradingFee.toNumber();
    },
};
