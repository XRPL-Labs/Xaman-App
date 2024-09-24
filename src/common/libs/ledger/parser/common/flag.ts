import { binary } from 'xrpl-accountlib';

import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

import { LedgerEntryFlags } from '@common/constants/flags';

import NetworkService from '@services/NetworkService';

/* types ==================================================================== */
export type ParsedFlags = {
    [key: string]: boolean;
};

export type Flag = {
    [key: string]: number;
};

export type TransactionFlags = {
    [key in TransactionTypes]?: Flag;
};

/* Class ==================================================================== */
class FlagParser {
    private readonly type: TransactionTypes | LedgerEntryTypes;
    private bitFlags?: number;

    private readonly _flags?: Flag;
    private readonly _indicesFlags?: Flag;

    constructor(type: TransactionTypes | LedgerEntryTypes, bitFlags?: number) {
        this.type = type;
        this.bitFlags = bitFlags;

        // set the flags from definitions
        const definitions = NetworkService.getNetworkDefinitions();

        // if the transaction flags is not present in the definitions use default flags
        const transactionFlags = definitions?.transactionFlags ?? binary.DEFAULT_DEFINITIONS.TRANSACTION_FLAGS;
        const indicesFlags =
            definitions?.transactionFlagsIndices ?? binary.DEFAULT_DEFINITIONS.TRANSACTION_FLAGS_INDICES;

        // transaction flags
        if (type in TransactionTypes && Object.prototype.hasOwnProperty.call(transactionFlags, type)) {
            this._flags = transactionFlags[type];
        }

        // ledger entry flags
        if (type in LedgerEntryTypes && Object.prototype.hasOwnProperty.call(LedgerEntryFlags, type)) {
            this._flags = LedgerEntryFlags[type as keyof typeof LedgerEntryFlags];
        }

        // indices flag
        if (type in TransactionTypes && Object.prototype.hasOwnProperty.call(indicesFlags, type)) {
            this._indicesFlags = indicesFlags[type];
        }
    }

    getIndices() {
        if (typeof this._indicesFlags === 'undefined') {
            throw new Error(`type ${this.type} does not include flag indices`);
        }

        return (
            Object.keys(this._indicesFlags).find((flagName) => this.bitFlags === this._indicesFlags![flagName]) ?? ''
        );
    }

    setIndices(flagName: string) {
        if (typeof this._indicesFlags === 'undefined') {
            throw new Error(`type ${this.type} does not include flag indices`);
        }

        const flagKey = Object.keys(this._indicesFlags).find((name) => name === flagName);

        if (typeof flagKey === 'undefined') {
            throw new Error(`flag indices ${flagName} not found!`);
        }

        return this._indicesFlags[flagKey];
    }

    get(): ParsedFlags {
        // no flag for this transaction type, just return empty object
        if (typeof this._flags === 'undefined' || typeof this.bitFlags === 'undefined') {
            return {};
        }

        const settings: ParsedFlags = {};

        // parse transaction flags
        for (const flagName in this._flags) {
            if (this.bitFlags & this._flags[flagName]) {
                settings[flagName] = true;
            } else {
                settings[flagName] = false;
            }
        }

        return settings;
    }

    /**
     * Sets the flags of the transaction.
     *
     * @param {ParsedFlags} flags - The flags to be set. (Object)
     * @throws {Error} - Throws an error if the transaction type does not support setting flags.
     * @returns {number} - The newly set flags value in UInt32.
     */
    set(flags: ParsedFlags): number {
        if (typeof this._flags === 'undefined') {
            throw new Error(`type ${this.type} doesn't not support setting flags!`);
        }

        // reset the flags
        this.bitFlags = 0;

        for (const flagName in flags) {
            if (flagName in this._flags && flags[flagName]) {
                this.bitFlags |= this._flags[flagName];
                // JavaScript converts operands to 32-bit signed Int before doing Bit-wise
                // operations. We need to convert it back to an unsigned int.
                this.bitFlags >>>= 0;
            } else {
                throw new Error(`flag ${flagName} does not exist in flags list!`);
            }
        }

        return this.bitFlags;
    }
}

/* Export ==================================================================== */
export default FlagParser;
