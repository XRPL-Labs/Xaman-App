import { AuthAccount } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const AuthAccounts = {
    decode: (_self: any, value: { AuthAccount: AuthAccount }[]): AuthAccount[] => {
        return value.map((a) => a.AuthAccount);
    },
    encode: (_self: any, value: AuthAccount[]): { AuthAccount: AuthAccount }[] => {
        return value.map((a) => {
            return {
                AuthAccount: a,
            };
        });
    },
};
