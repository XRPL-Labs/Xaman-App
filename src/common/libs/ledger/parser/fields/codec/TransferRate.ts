import BigNumber from 'bignumber.js';

/* Codec ==================================================================== */
export const TransferRate = {
    decode: (_self: any, value: string): number => {
        const transferRate = new BigNumber(value);

        if (transferRate.isZero()) {
            return 0;
        }

        return transferRate.dividedBy(1000000).minus(1000).dividedBy(10).toNumber();
    },
    encode: (_self: any, value: number): number => {
        const transferRate = new BigNumber(value).multipliedBy(10).plus(1000).multipliedBy(1000000);

        if ((transferRate.isGreaterThan(2000000000) || transferRate.isLessThan(1000000000)) && !transferRate.isZero()) {
            throw new Error('TransferRate value cannot be more than 2000000000 or less than 1000000000');
        }

        return transferRate.toNumber();
    },
};
