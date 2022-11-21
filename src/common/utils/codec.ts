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
 * Decode account id
 * @param account string
 * @returns decoded account id
 */
const DecodeAccountId = (account: string): string => {
    const decodedAccount = decodeAccountID(account);
    return HexEncoding.toHex(decodedAccount).toUpperCase();
};

/**
 * Calculate NFT token ID
 * @param account string
 * @param tokenSequence number
 * @param flags number
 * @param transferFee number
 * @param tokenTaxon number
 * @returns encoded offer index in hex
 */
const EncodeNFTokenID = (
    account: string,
    tokenSequence: number,
    flags: number,
    transferFee: number,
    tokenTaxon: number,
): string => {
    const issuer = decodeAccountID(account);
    const cipheredTaxon = tokenTaxon ^ (384160001 * tokenSequence + 2459);

    const tokenID = Buffer.concat([
        Buffer.from([(flags >> 8) & 0xff, flags & 0xff]),
        Buffer.from([(transferFee >> 8) & 0xff, transferFee & 0xff]),
        issuer,
        Buffer.from([
            (cipheredTaxon >> 24) & 0xff,
            (cipheredTaxon >> 16) & 0xff,
            (cipheredTaxon >> 8) & 0xff,
            cipheredTaxon & 0xff,
        ]),
        Buffer.from([
            (tokenSequence >> 24) & 0xff,
            (tokenSequence >> 16) & 0xff,
            (tokenSequence >> 8) & 0xff,
            tokenSequence & 0xff,
        ]),
    ]);

    // should be 32 bytes
    if (tokenID.length !== 32) {
        return '';
    }

    return HexEncoding.toHex(tokenID).toUpperCase();
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
export { ConvertCodecAlphabet, NormalizeDestination, EncodeLedgerIndex, EncodeNFTokenID, DecodeAccountId };
