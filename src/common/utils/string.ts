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

const Capitalize = (str: string) => {
    if (!str) {
        return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/* Export ==================================================================== */
export { HexEncoding, Truncate, Capitalize };
