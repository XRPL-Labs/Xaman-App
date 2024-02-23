import { SignerEntry } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const SignerEntries = {
    decode: (_self: any, value: { SignerEntry: SignerEntry }[]): SignerEntry[] => {
        return value.map((s) => s.SignerEntry);
    },
    encode: (_self: any, value: SignerEntry[]): { SignerEntry: SignerEntry }[] => {
        return value.map((s) => {
            return {
                SignerEntry: s,
            };
        });
    },
};
