import MemoParser from '@common/libs/ledger/parser/common/memo';

import { MemoType } from '@common/libs/ledger/parser/types';

/* Codec ==================================================================== */
export const Memos = {
    decode: (_self: any, value: { Memo: MemoType }[]): MemoType[] => {
        return value.map((m) => MemoParser.Decode(m.Memo));
    },
    encode: (_self: any, value: MemoType[]): { Memo: MemoType }[] => {
        return value.map((memo) => {
            return {
                Memo: memo,
            };
        });
    },
};
