/**
 * UUID encoding
 */
const UUIDEncoding = {
    toHex: (uuid: string): string => {
        if (uuid.length % 2 !== 0) {
            throw new Error('Must have an even number to convert to bytes');
        }
        const numBytes = uuid.length / 2;
        const byteArray = new Uint8Array(numBytes);
        for (let i = 0; i < numBytes; i++) {
            let byte;
            const byteChar = uuid.substr(i * 2, 2);

            if (byteChar[0] === '-') {
                byte = (parseInt(`0${byteChar[1]}`, 16) * -1) & 0xff;
            } else if (byteChar[1] === '-') {
                byte = parseInt(byteChar[0], 16);
            } else {
                byte = parseInt(byteChar, 16);
            }
            byteArray[i] = byte;
        }

        return Array.from(byteArray, (byte) => {
            return `0${(byte & 0xff).toString(16)}`.slice(-2);
        }).join('');
    },
};

/**
 * Hex encoding/decoding
 */
const HexEncoding = {
    toBinary: (hex: string): Buffer => {
        return Buffer.from(hex, 'hex');
    },

    toString: (hex: string): string => {
        return Buffer.from(hex, 'hex').toString('utf8');
    },

    toHex: (text: string | number[] | Buffer): string => {
        return Buffer.from(text).toString('hex');
    },

    toUTF8: (hex: string): string => {
        const buffer = Buffer.from(hex, 'hex');
        const isValid = Buffer.compare(Buffer.from(buffer.toString(), 'utf8'), buffer) === 0;

        if (isValid) {
            return buffer.toString('utf8');
        }
        return hex;
    },

    isRegularString: (hexDecodedStr: string) => {
        return /^[\x20-\x7E]+$/.test(hexDecodedStr);
    },

    hasOddCharacters: (hexDecodedStr: string) => {
        return /[^\x20-\x7E]/.test(hexDecodedStr);
    },

    displayHex(value: string) {
        try {
            const v = HexEncoding.toString(value);
            if (v && typeof v === 'string') {
                return HexEncoding.isRegularString(v) && !HexEncoding.hasOddCharacters(v) ? v : value;
            }
        } catch (e) {
            //
        }
        return value;
    },
};

/**
 * Truncate string
 * @param fullString string
 * @param stringLength number expected output length
 * @returns stringTruncate text ABC...EFG
 */
const Truncate = (fullString: string, stringLength: number): string => {
    if (fullString.length <= stringLength) {
        return fullString;
    }

    const separator = '...';

    const separatorLength = separator.length;
    const charsToShow = stringLength - separatorLength;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return fullString.substring(0, frontChars) + separator + fullString.substring(fullString.length - backChars);
};

/**
 * Capitalize string
 * @param str string
 * @returns capitalize string test -> Test
 */
const Capitalize = (str: string) => {
    if (!str) {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check string type
 * @param str value in string
 * @returns boolean
 */
const StringTypeCheck = {
    isValidUUID: (input: string): boolean => {
        if (typeof input !== 'string') {
            return false;
        }
        // TODO: fix eslint error
        // eslint-disable-next-line prefer-regex-literals,no-control-regex
        const uuidv4RegExp = new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', 'i');
        return !!input && uuidv4RegExp.test(input);
    },

    isValidURL: (input: string): boolean => {
        // TODO: fix eslint error
        // eslint-disable-next-line prefer-regex-literals,no-control-regex
        const urlRegExp = new RegExp('^https://[a-zA-Z0-9][a-zA-Z0-9-.]+[a-zA-Z0-9].[a-zA-Z]{1,}[?/]{0,3}[^\r\n\t]+');
        return !!input && urlRegExp.test(input);
    },

    isValidAmount: (input: string): boolean => {
        // TODO: fix eslint error
        // eslint-disable-next-line prefer-regex-literals,no-control-regex
        const amountRegExp = new RegExp(/^(?![0.]+$)\d+(\.\d{1,15})?$/gm);
        return !!input && amountRegExp.test(input);
    },

    isValidHash: (input: string): boolean => {
        // TODO: fix eslint error
        // eslint-disable-next-line prefer-regex-literals,no-control-regex
        const hashRegExp = new RegExp('^[A-F0-9]{64}$', 'i');
        return !!input && hashRegExp.test(input);
    },

    isValidXAppIdentifier: (input: string): boolean => {
        // TODO: fix eslint error
        // eslint-disable-next-line prefer-regex-literals,no-control-regex
        const identifier = new RegExp('^[A-Z0-9._-]+$', 'i');
        return !!input && identifier.test(input);
    },

    isValidDestinationTag: (input: string): boolean => {
        // not a valid input
        if (typeof input !== 'string') {
            return false;
        }

        // not a valid number
        if (!input.match(/^[+-]?\d+(?:[.]*\d*(?:[eE][+-]?\d+)?)?$/)) {
            return false;
        }

        // valid positive 32 bits integer integer
        return !(input === '' || Number(input) > 2 ** 32 || Number(input) < 0 || input.includes('.'));
    },
};

/**
 * Create identifier crc32 from string
 * @param str value in string
 * @returns identifier version of string
 */
const StringIdentifier = (str: String): number => {
    let crc = 0xffffffff;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i);
        for (let bit = 0; bit < 8; bit++) {
            if ((crc & 1) !== 0) crc = (crc >>> 1) ^ 0xedb88320;
            else crc >>>= 1;
        }
    }
    return ~crc;
};

/* Export ==================================================================== */
export { HexEncoding, UUIDEncoding, Truncate, Capitalize, StringTypeCheck, StringIdentifier };
