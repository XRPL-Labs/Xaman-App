import { Signer } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const Signers = {
    decode: (_self: any, value: { Signer: Signer }[]): Signer[] => {
        return value.map((s) => s.Signer);
    },
    encode: (_self: any, value: Signer[]): { Signer: Signer }[] => {
        return value.map((s) => {
            return {
                Signer: s,
            };
        });
    },
};
