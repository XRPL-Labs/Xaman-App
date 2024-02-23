import { HookParameter } from '@common/libs/ledger/types/common';

/* Codec ==================================================================== */
export const HookParameters = {
    decode: (_self: any, value: { HookParameter: HookParameter }[]): HookParameter[] => {
        return value.map((item) => {
            return {
                HookParameterName: item.HookParameter.HookParameterName,
                HookParameterValue: item.HookParameter.HookParameterValue,
            };
        });
    },
    encode: (_self: any, value: HookParameter[]): { HookParameter: HookParameter }[] => {
        return value.map((parameter) => {
            return {
                HookParameter: parameter,
            };
        });
    },
};
