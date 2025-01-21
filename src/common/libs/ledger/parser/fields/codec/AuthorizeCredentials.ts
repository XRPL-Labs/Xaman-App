import { Credential } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const AuthorizeCredentials = {
    decode: (_self: any, value: { Credential: Credential }[]): Credential[] => {
        return value.map((s) => s.Credential);
    },
    encode: (_self: any, value: Credential[]): { Credential: Credential }[] => {
        return value.map((s) => {
            return {
                Credential: s,
            };
        });
    },
};
