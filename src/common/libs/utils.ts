/**
 * Utils
 *
 */
import moment from 'moment-timezone';
import BigNumber from 'bignumber.js';

import { utils as AccountLibUtils } from 'xrpl-accountlib';
import { Decode } from 'xrpl-tagged-address-codec';
import { XrplDestination } from 'xumm-string-decode';
/* Hex Encoding  ==================================================================== */
const HexEncoding = {
    toBinary: (hex: string): Buffer => {
        return hex ? Buffer.from(hex, 'hex') : undefined;
    },

    toString: (hex: string): string | undefined => {
        return hex ? Buffer.from(hex, 'hex').toString('utf-8') : undefined;
    },

    toHex: (text: string): string | undefined => {
        return text ? Buffer.from(text).toString('hex') : undefined;
    },
};

// Truncate text ABC...EFG
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

const NormalizeCurrencyCode = (currencyCode: string): string => {
    if (!currencyCode) return '';

    // Native XRP
    if (currencyCode === 'XRP') {
        return currencyCode;
    }

    // IOU
    // currency code is hex try to decode it
    if (currencyCode.match(/^[A-F0-9]{40}$/)) {
        const decoded = HexEncoding.toString(currencyCode);

        if (decoded) {
            const clean = decoded.replace(/\0.*$/g, '').replace(/(\r\n|\n|\r)/gm, ' ');
            // check if it's fake XRP
            if (clean.toLowerCase().trim() === 'xrp') {
                return 'FakeXRP';
            }
            return clean;
        }

        return `${currencyCode.slice(0, 4)}...`;
    }

    if (currencyCode.toLowerCase().trim() === 'xrp') {
        return 'FakeXRP';
    }

    return currencyCode;
};

const NormalizeDestination = (destination: XrplDestination): XrplDestination & { xAddress: string } => {
    let to;
    let tag;
    let xAddress;

    try {
        // decode if it's x address
        if (destination.to.startsWith('X')) {
            try {
                const decoded = Decode(destination.to);
                to = decoded.account;
                tag = Number(decoded.tag);

                xAddress = destination.to;
            } catch {
                // ignore
            }
        } else if (AccountLibUtils.isValidAddress(destination.to)) {
            to = destination.to;
            tag = destination.tag;
        }
    } catch {
        // ignore
    }

    return {
        to,
        tag,
        xAddress,
    };
};

/**
 * normalize balance
 * @param n number
 * @returns string 1333.855222
 */
const NormalizeBalance = (balance: number) => {
    return new BigNumber(balance).decimalPlaces(6).toString(10);
};

/**
 * format the date
 * @param date
 * @returns string September 4 1986 8:30 PM
 */
const FormatDate = (date: string): string => {
    return moment(date).format('lll');
};

/**
 * Compare two dotted version strings (like '10.2.3').
 * @returns {Integer} 0: v1 == v2, -1: v1 < v2, 1: v1 > v2
 */
const VersionDiff = (v1: string, v2: string) => {
    const v1parts = `${v1}`.split('.');
    const v2parts = `${v2}`.split('.');

    const minLength = Math.min(v1parts.length, v2parts.length);

    let p1;
    let p2;

    // Compare tuple pair-by-pair.
    for (let i = 0; i < minLength; i++) {
        // Convert to integer if possible, because "8" > "10".
        p1 = parseInt(v1parts[i], 10);
        p2 = parseInt(v2parts[i], 10);
        if (Number.isNaN(p1)) {
            p1 = v1parts[i];
        }
        if (Number.isNaN(p2)) {
            p2 = v2parts[i];
        }
        if (p1 === p2) {
            continue;
        } else if (p1 > p2) {
            return 1;
        } else if (p1 < p2) {
            return -1;
        }
        // one operand is NaN
        return NaN;
    }
    // The longer tuple is always considered 'greater'
    if (v1parts.length === v2parts.length) {
        return 0;
    }
    return v1parts.length < v2parts.length ? -1 : 1;
};

/* Export ==================================================================== */
export {
    HexEncoding,
    Truncate,
    FormatDate,
    NormalizeBalance,
    NormalizeCurrencyCode,
    NormalizeDestination,
    VersionDiff,
};
