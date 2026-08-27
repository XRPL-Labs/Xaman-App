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
class MemoParser {
    static BinaryRegex = /^[ \t]*(0x)?([a-f0-9]{20,})[ \t]*$/i;

    /**
     * @return encoded memo
     */
    static Encode(data: string): MemoLedgerType {
        // application/x-binary
        if (MemoParser.BinaryRegex.test(data.trim())) {
            return {
                MemoData: data.trim().match(MemoParser.BinaryRegex)![2],
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

        let decodedFormat = MemoFormat ? HexEncoding.toUTF8(MemoFormat) : undefined;
        const decodedType = MemoType ? HexEncoding.toUTF8(MemoType) : undefined;

        // if application/x-binary then return the data without decoding to hex
        if (decodedFormat === MemoFormats.ApplicationBinary) {
            return {
                MemoData,
                MemoFormat: decodedFormat,
                MemoType: decodedType,
            };
        }

        if (!decodedFormat && typeof MemoData === 'string') {
            if (MemoData.match(/^[0-9A-F]+$/)) {
                if (MemoData.length % 2 === 0 && MemoData.length > 16) {
                    const asUtf8 = HexEncoding.toUTF8(MemoData);
                    if (!asUtf8.match(/[a-zA-Z0-9\s]{3,}.*[a-zA-Z0-9\s]{3,}/) && !decodedType) {
                        decodedFormat = 'hex';
                    }
                }
            }
        }

        let _MemoData = MemoData;
        switch (decodedFormat) {
            case 'hex':
                // Do nothing
                break;
            case 'utf8':
                // Do nothing
                _MemoData = HexEncoding.toUTF8(String(_MemoData || ''));
                break;
            case 'hexasint':
                if (typeof MemoData === 'string' && MemoData.match(/^[0-9]+$/)) {
                    _MemoData = String(parseInt(MemoData, 16));
                }
                break;
            case 'int':
                if (typeof MemoData === 'string' && MemoData.match(/^[0-9]+$/)) {
                    _MemoData = String(parseInt(MemoData, 10));
                }
                break;
            default:
                _MemoData = _MemoData ? HexEncoding.toUTF8(String(_MemoData || '')) : undefined;
        }

        return {
            MemoType: decodedType,
            MemoFormat: _MemoData !== MemoData && decodedFormat !== 'utf8' ? decodedFormat : undefined,
            MemoData: _MemoData,
        };
    }
}

export default MemoParser;
