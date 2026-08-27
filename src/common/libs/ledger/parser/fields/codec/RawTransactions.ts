import { TransactionJson } from '@common/libs/ledger/types/transaction';

/* Codec ==================================================================== */
export const RawTransactions = {
    decode: (_self: any, value: { RawTransaction: TransactionJson }[]): TransactionJson[] => {
        return value.map((item) => {
            return item.RawTransaction;
        });
    },
    encode: (_self: any, value: TransactionJson[]): { RawTransaction: TransactionJson }[] => {
        return value.map((parameter) => {
            return {
                RawTransaction: parameter,
            };
        });
    },
};
