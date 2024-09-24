import { LedgerDateParser } from '@common/libs/ledger/parser/common';

/* Codec ==================================================================== */
export const RippleTime = {
    decode: (_self: any, value: number): string => {
        return new LedgerDateParser(value).toISO8601();
    },
    encode: (_self: any, value: string): number => {
        return new LedgerDateParser(value).toLedgerTime();
    },
};
