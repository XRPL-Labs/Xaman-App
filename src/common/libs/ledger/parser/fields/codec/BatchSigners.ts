import { BatchSigner } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const BatchSigners = {
    decode: (_self: any, value: { BatchSigner: BatchSigner }[]): BatchSigner[] => {
        return value.map((item) => {
            return item.BatchSigner;
        });
    },
    encode: (_self: any, value: BatchSigner[]): { BatchSigner: BatchSigner }[] => {
        return value.map((parameter) => {
            return {
                BatchSigner: parameter,
            };
        });
    },
};
