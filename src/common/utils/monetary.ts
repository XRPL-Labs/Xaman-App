import BigNumber from 'bignumber.js';

import NetworkService from '@services/NetworkService';

import { HexEncoding, Truncate } from './string';

/* Monetary utils  ==================================================================== */
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
 * @returns number normalized value of amount
 * @param amount
 */
const NormalizeAmount = (amount: number | string): number => {
    return new BigNumber(amount).decimalPlaces(8).toNumber();
};

/**
 * normalize XRPL currency code
 * @param currencyCode string
 * @returns normalized XRPL currency code
 */
const NormalizeCurrencyCode = (currencyCode: string): string => {
    if (!currencyCode || typeof currencyCode !== 'string') return '';

    // Native currency
    if (currencyCode === NetworkService.getNativeAsset()) {
        return currencyCode;
    }

    // IOU claims as native currency which consider as fake
    if (currencyCode.toLowerCase() === NetworkService.getNativeAsset().toLowerCase()) {
        return `Fake${NetworkService.getNativeAsset()}`;
    }

    // IOU
    // currency code is hex try to decode it
    if (currencyCode.match(/^[A-F0-9]{40}$/)) {
        let decoded: string;

        // LP Token
        if (currencyCode.startsWith('03')) {
            // remove the first two letters and return the rest
            return `LP ${Truncate(currencyCode.slice(2), 10)}`;
        }

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

            // check if decoded contains native currency
            if (clean.toLowerCase().trim() === NetworkService.getNativeAsset().toLowerCase()) {
                return `Fake${NetworkService.getNativeAsset()}`;
            }
            return clean;
        }

        // if not decoded then return truncated hex value
        return `${currencyCode.slice(0, 4)}...`;
    }

    return currencyCode;
};

/* Export ==================================================================== */
export { NormalizeAmount, NormalizeCurrencyCode, ValueToIOU };
