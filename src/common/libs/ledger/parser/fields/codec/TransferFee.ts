import BigNumber from 'bignumber.js';

/* Codec ==================================================================== */
export const TransferFee = {
    decode: (_self: any, value: number): number => {
        const transferFee = new BigNumber(value);

        if (transferFee.isZero()) {
            return 0;
        }

        return transferFee.dividedBy(1000).toNumber();
    },
    encode: (_self: any, value: number): number => {
        const transferFee = new BigNumber(value).multipliedBy(1000);

        if (transferFee.isGreaterThan(50000) || transferFee.isLessThan(0)) {
            throw new Error('TransferFee value cannot be more than 50% or less than 0%');
        }

        return transferFee.toNumber();
    },
};
