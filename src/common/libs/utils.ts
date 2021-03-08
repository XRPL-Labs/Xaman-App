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

/**
 * normalize XRPL currency code
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
 * normalize XRPL currency code
 * @param currencyCode string
 * @returns normalized XRPL currency code
 */
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

/**
 * normalize XRPL destination
 * @param destination XrplDestination
 * @returns normalized XrplDestination
 */
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
 * Convert XRPL value to NFT value
 * @param value number
 * @returns number in NFT value or false if XRPL value is not NFT
 */
const XRPLValueToNFT = (value: number): number | boolean => {
    const data = String(Number(value)).split(/e/i);

    const finish = (returnValue: string) => {
        const unsignedReturnValue = returnValue.replace(/^-/, '');
        if (data.length > 1 && unsignedReturnValue.slice(0, 2) === '0.' && Number(data[1]) < -70) {
            // Positive below zero amount, could be NFT
            return (
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                (sign === '-' ? -1 : 1) *
                Number((unsignedReturnValue.slice(2) + '0'.repeat(83 - unsignedReturnValue.length)).replace(/^0+/, ''))
            );
        }
        return false;
    };

    if (data.length === 1) {
        // Regular (non-exponent)
        return false;
    }

    let z = '';
    const sign = value < 0 ? '-' : '';
    const str = data[0].replace('.', '');
    let mag = Number(data[1]) + 1;

    if (mag < 0) {
        z = `${sign}0.`;
        while (mag++) {
            z += '0';
        }
        return finish(z + str.replace(/^-/, ''));
    }
    mag -= str.length;

    while (mag--) {
        z += '0';
    }
    return finish(str + z);
};

/**
 * Convert NFT value to XRPL value
 * @param value string
 * @param balance number XRPL string notation, optional, if intention to force NFT check
 * @returns string in XRPL value
 */
const NFTValueToXRPL = (value: string, balance?: number): string => {
    const unsignedValue = String(value).replace(/^-/, '');
    const sign = unsignedValue.length < String(value).length ? '-' : '';

    // accountBalance: xrpl string notation, optional, if intention to force NFT check
    if (typeof balance !== 'undefined' && XRPLValueToNFT(balance) === false) {
        throw new Error('Source balance is not NFT-like');
    }
    if (!unsignedValue.match(/^[0-9]+$/)) {
        throw new Error('Only non-float & non-scientific notation values accepted');
    }

    return `${sign}0.${'0'.repeat(81 - unsignedValue.length)}${unsignedValue}`;
};

/**
 * normalize amount
 * @param n number
 * @returns string 1333.855222
 */
const NormalizeAmount = (amount: number): number => {
    const nftValue = XRPLValueToNFT(amount);
    if (nftValue) {
        return Number(nftValue);
    }
    return new BigNumber(amount).decimalPlaces(8).toNumber();
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

/**
 * Convert seed/address to another alphabet
 * @param value string
 * @param alphabet string
 * @param toXRPL boolean
 * @returns seed/address in new alphabet
 */
const ConvertCodecAlphabet = (value: string, alphabet: string, toXRPL = true) => {
    const xrplAlphabet = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
    return value
        .split('')
        .map((char) => (toXRPL ? xrplAlphabet[alphabet.indexOf(char)] : alphabet[xrplAlphabet.indexOf(char)]))
        .join('');
};

/* Export ==================================================================== */
export {
    HexEncoding,
    Truncate,
    FormatDate,
    NormalizeAmount,
    NormalizeCurrencyCode,
    NormalizeDestination,
    ConvertCodecAlphabet,
    XRPLValueToNFT,
    NFTValueToXRPL,
    VersionDiff,
};
