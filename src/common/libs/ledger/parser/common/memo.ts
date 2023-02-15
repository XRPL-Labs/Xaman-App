import { HexEncoding } from '@common/utils/string';

import { MemoType as MemoLedgerType } from '../types';

/* Types ==================================================================== */
enum MemoFormats {
    TextPlain = 'text/plain',
    ApplicationBinary = 'application/x-binary',
}

enum MemoTypes {
    Description = 'Description',
    Reference = 'Reference',
}

/* Class ==================================================================== */
class Memo {
    static BinaryRegex = /^[ \t]*(0x)?([a-f0-9]{20,})[ \t]*$/i;

    /**
     * @return encoded memo
     */
    static Encode(data: string): MemoLedgerType {
        // application/x-binary
        if (Memo.BinaryRegex.test(data.trim())) {
            return {
                MemoData: data.trim().match(Memo.BinaryRegex)[2],
                MemoFormat: HexEncoding.toHex(MemoFormats.ApplicationBinary).toUpperCase(),
                MemoType: HexEncoding.toHex(MemoTypes.Reference).toUpperCase(),
            };
        }

        // 'text/plain
        return {
            MemoData: HexEncoding.toHex(data).toUpperCase(),
            MemoFormat: HexEncoding.toHex(MemoFormats.TextPlain).toUpperCase(),
            MemoType: HexEncoding.toHex(MemoTypes.Description).toUpperCase(),
        };
    }

    /**
     * @return decoded memo
     */
    static Decode(memo: MemoLedgerType): MemoLedgerType {
        // check memo format
        const { MemoData, MemoFormat, MemoType } = memo;

        const decodedFormat = HexEncoding.toUTF8(MemoFormat);
        const decodedType = HexEncoding.toUTF8(MemoType);

        // if application/x-binary then return the data without decoding to hex
        if (decodedFormat === MemoFormats.ApplicationBinary) {
            return {
                MemoData,
                MemoFormat: decodedFormat,
                MemoType: decodedType,
            };
        }

        return {
            MemoData: HexEncoding.toUTF8(MemoData),
            MemoFormat: decodedFormat,
            MemoType: decodedType,
        };
    }
}

export default Memo;
