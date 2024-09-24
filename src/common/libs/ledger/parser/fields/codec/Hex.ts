import { HexEncoding } from '@common/utils/string';

/* Codec ==================================================================== */
export const Hex = {
    encode: (_self: any, value: string): string => {
        return HexEncoding.toHex(value);
    },
    decode: (_self: any, value: string): string => {
        return HexEncoding.toUTF8(value);
    },
};
