import { Permission } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const PermissionEntries = {
    decode: (_self: any, value: { Permission: Permission }[]): Permission[] => {
        return value.map((s) => s.Permission);
    },
    encode: (_self: any, value: Permission[]): { Permission: Permission }[] => {
        return value.map((s) => {
            return {
                Permission: s,
            };
        });
    },
};
