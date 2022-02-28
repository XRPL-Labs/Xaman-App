/* Hex Encoding  ==================================================================== */
const HexEncoding = {
    toBinary: (hex: string): Buffer => {
        return hex ? Buffer.from(hex, 'hex') : undefined;
    },

    toString: (hex: string): string | undefined => {
        return hex ? Buffer.from(hex, 'hex').toString('utf8') : undefined;
    },

    toHex: (text: string): string | undefined => {
        return text ? Buffer.from(text).toString('hex') : undefined;
    },

    toUTF8: (hex: string): string | undefined => {
        if (!hex) return undefined;

        const buffer = Buffer.from(hex, 'hex');
        const isValid = Buffer.compare(Buffer.from(buffer.toString(), 'utf8'), buffer) === 0;

        if (isValid) {
            return buffer.toString('utf8');
        }
        return hex;
    },
};

/**
 * Truncate string
 * @param fullString string
 * @param string_length number expected output length
 * @returns stringTruncate text ABC...EFG
 */
const Truncate = (fullString: string, string_length: number): string => {
    if (fullString.length <= string_length) {
        return fullString;
    }

    const separator = '...';

    const separator_length = separator.length;
    const charsToShow = string_length - separator_length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return fullString.substr(0, frontChars) + separator + fullString.substr(fullString.length - backChars);
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
        const uuidv4RegExp = new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', 'i');
        return uuidv4RegExp.test(input);
    },

    isValidURL: (input: string): boolean => {
        if (typeof input !== 'string') {
            return false;
        }
        // eslint-disable-next-line no-control-regex
        const urlRegExp = new RegExp('^https://[a-zA-Z0-9][a-zA-Z0-9-.]+[a-zA-Z0-9].[a-zA-Z]{1,}[?/]{0,3}[^\r\n\t]+');
        return urlRegExp.test(input);
    },

    isValidAmount: (input: string): boolean => {
        if (typeof input !== 'string') {
            return false;
        }
        const amountRegExp = new RegExp(/^(?![0.]+$)\d+(\.\d{1,15})?$/gm);
        return amountRegExp.test(input);
    },

    isValidHash: (input: string): boolean => {
        if (typeof input !== 'string') {
            return false;
        }
        const hashRegExp = new RegExp('^[A-F0-9]{64}$', 'i');
        return hashRegExp.test(input);
    },
};

/* Export ==================================================================== */
export { HexEncoding, Truncate, Capitalize, StringTypeCheck };
