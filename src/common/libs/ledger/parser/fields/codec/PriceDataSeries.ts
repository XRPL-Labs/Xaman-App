import { PriceData } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const PriceDataSeries = {
    decode: (_self: any, value: { PriceData: PriceData }[]): PriceData[] => {
        return value.map((s) => s.PriceData);
    },
    encode: (_self: any, value: PriceData[]): { PriceData: PriceData }[] => {
        return value.map((s) => {
            return {
                PriceData: s,
            };
        });
    },
};
