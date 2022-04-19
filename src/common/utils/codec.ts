import { utils as AccountLibUtils } from 'xrpl-accountlib';
import { xAddressToClassicAddress, decodeAccountID } from 'ripple-address-codec';
import { XrplDestination } from 'xumm-string-decode';

import { HexEncoding } from '@common/utils/string';

/**
 * Calculate Ledger index hex
 * @param account string
 * @param sequence number
 * @returns encoded offer index in hex
 */
const EncodeLedgerIndex = (account: string, sequence: number) => {
    let sequenceHex = sequence.toString(16);
    if (sequenceHex.length > 8) return false;
    sequenceHex = '0'.repeat(8 - sequenceHex.length) + sequenceHex;
    const payloadHex = `006F${decodeAccountID(account).toString('hex')}${sequenceHex}`;
    return HexEncoding.toHex(AccountLibUtils.hash(payloadHex)).toUpperCase();
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
                const decoded = xAddressToClassicAddress(destination.to);
                to = decoded.classicAddress;
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

/* Export ==================================================================== */
export { ConvertCodecAlphabet, NormalizeDestination, EncodeLedgerIndex };
