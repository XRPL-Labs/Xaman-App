import BigNumber from 'bignumber.js';
import { utils as AccountLibUtils } from 'xrpl-accountlib';
import { xAddressToClassicAddress, decodeAccountID, encodeAccountID } from 'ripple-address-codec';
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
 * Encode/Calculate NFT token ID
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

    const unscrambleTaxon = new BigNumber(384160001)
        .multipliedBy(tokenSequence)
        .modulo(4294967296)
        .plus(2459)
        .modulo(4294967296)
        .toNumber();

    const cipheredTaxon = (tokenTaxon ^ unscrambleTaxon) >>> 0;

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
 * Decode NFT token ID
 * @param nfTokenID string
 * @returns decoded NFToken object
 */
const DecodeNFTokenID = (nfTokenID: string) => {
    if (nfTokenID.length !== 64) {
        throw new Error('Invalid nfTokenID, should be 64 bytes hex');
    }

    const scrambledTaxon = new BigNumber(nfTokenID.substring(48, 56), 16).toNumber();
    const sequence = new BigNumber(nfTokenID.substring(56, 64), 16).toNumber();
    const unscrambleTaxon = new BigNumber(384160001).multipliedBy(sequence).modulo(4294967296).plus(2459).toNumber();

    const cipheredTaxon = (scrambledTaxon ^ unscrambleTaxon) >>> 0;

    const taxon = new BigNumber(cipheredTaxon).modulo(4294967296).toNumber();

    return {
        NFTokenID: nfTokenID,
        Flags: new BigNumber(nfTokenID.substring(0, 4), 16).toNumber(),
        TransferFee: new BigNumber(nfTokenID.substring(4, 8), 16).toNumber(),
        Issuer: encodeAccountID(Buffer.from(nfTokenID.substring(8, 48), 'hex')),
        Taxon: taxon,
        Sequence: sequence,
    };
};

/**
 * Encode CTID
 * @param ledgerSeq number
 * @param txnIndex number
 * @param networkId number
 * @returns encoded CTID
 */
const EncodeCTID = (ledgerSeq: number, txnIndex: number, networkId: number): string => {
    if (typeof ledgerSeq !== 'number') {
        throw new Error(`ledgerSeq must be a number got ${typeof ledgerSeq}.`);
    }
    if (ledgerSeq > 0xfffffff || ledgerSeq < 0) {
        throw new Error(`ledgerSeq must not be greater than 268435455 or less than 0, got ${ledgerSeq}.`);
    }

    if (typeof txnIndex !== 'number') {
        throw new Error(`txnIndex must be a number got ${txnIndex}.`);
    }
    if (txnIndex > 0xffff || txnIndex < 0) {
        throw new Error(`txnIndex must not be greater than 65535 or less than 0, got ${txnIndex}`);
    }

    if (typeof networkId !== 'number') {
        throw new Error(`networkId must be a number got ${typeof networkId}.`);
    }
    if (networkId > 0xffff || networkId < 0) {
        throw new Error(`networkId must not be greater than 65535 or less than 0, got ${networkId}`);
    }

    // @ts-ignore
    return (((BigInt(0xc0000000) + BigInt(ledgerSeq)) << 32n) + (BigInt(txnIndex) << 16n) + BigInt(networkId))
        .toString(16)
        .toUpperCase();
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
export {
    ConvertCodecAlphabet,
    NormalizeDestination,
    EncodeLedgerIndex,
    EncodeNFTokenID,
    DecodeNFTokenID,
    DecodeAccountId,
    EncodeCTID,
};
