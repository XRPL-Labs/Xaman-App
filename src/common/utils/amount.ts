import BigNumber from 'bignumber.js';

import { HexEncoding } from './string';

/**
 * Convert XRPL value to NFT value
 * @param value number
 * @returns number in NFT value or false if XRPL value is not NFT
 */
const XRPLValueToNFT = (value: number): number | boolean => {
    const data = String(Number(value)).split(/e/i);

    const finish = (returnValue: string) => {
        const unsignedReturnValue = returnValue.replace(/^-/, '');
        if (unsignedReturnValue.length > 83) {
            // Too many tokens to be NFT-like as per XLS14d proposal
            return false;
        }
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
 * normalize value to IOU value
 * @param value string
 * @returns IOU value in normalized string
 */
const ValueToIOU = (value: string): string => {
    const MAX_IOU_PRECISION = 16;

    if (!value || typeof value !== 'string') {
        throw new Error('Value is not valid string!');
    }

    if (value.split('.')[0].length > MAX_IOU_PRECISION) {
        throw new Error('Amount too high to reliably slice!');
    }

    let iouValue = value;
    if (iouValue.replace('.', '').replace(/0+$/, '').length > MAX_IOU_PRECISION) {
        iouValue = iouValue
            .slice(0, MAX_IOU_PRECISION + (iouValue.includes('.') ? 1 : 0))
            .replace(/0+$/, '')
            .replace(/\.$/, '');
    }

    return iouValue;
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
 * normalize XRPL currency code
 * @param currencyCode string
 * @returns normalized XRPL currency code
 */
const NormalizeCurrencyCode = (currencyCode: string): string => {
    if (!currencyCode || typeof currencyCode !== 'string') return '';

    // Native XRP
    if (currencyCode === 'XRP') {
        return currencyCode;
    }

    // IOU claims as XRP which consider as fake XRP
    if (currencyCode.toLowerCase() === 'xrp') {
        return 'FakeXRP';
    }

    // IOU
    // currency code is hex try to decode it
    if (currencyCode.match(/^[A-F0-9]{40}$/)) {
        let decoded = '';

        // check for XLS15d
        if (currencyCode.startsWith('02')) {
            try {
                const binary = HexEncoding.toBinary(currencyCode);
                decoded = binary.slice(8).toString('utf-8');
            } catch {
                decoded = HexEncoding.toString(currencyCode);
            }
        } else {
            decoded = HexEncoding.toString(currencyCode);
        }

        if (decoded) {
            // cleanup break lines and null bytes
            const clean = decoded.replace(/\0/g, '').replace(/(\r\n|\n|\r)/gm, ' ');

            // check if decoded contains xrp
            if (clean.toLowerCase().trim() === 'xrp') {
                return 'FakeXRP';
            }
            return clean;
        }

        // if not decoded then return truncated hex value
        return `${currencyCode.slice(0, 4)}...`;
    }

    return currencyCode;
};

/* Export ==================================================================== */
export { NormalizeAmount, NormalizeCurrencyCode, XRPLValueToNFT, NFTValueToXRPL, ValueToIOU };
