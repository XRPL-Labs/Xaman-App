import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

import { txFlagIndices, txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { objectFlags } from '@common/libs/ledger/parser/common/flags/objectFlags';

import { Flag } from '@common/libs/ledger/parser/common/flags/types';

/* types ==================================================================== */
export type ParsedFlags = {
    [key: string]: boolean;
};

/* Class ==================================================================== */
class FlagParser {
    private readonly type: TransactionTypes | LedgerEntryTypes;
    private readonly txFlagsList?: Flag;
    private flagsInt?: number;

    constructor(type: TransactionTypes | LedgerEntryTypes, flagsInt?: number) {
        this.type = type;
        this.flagsInt = flagsInt;
        this.txFlagsList = this.getFlagsList(type);
    }

    private getFlagsList = (type: TransactionTypes | LedgerEntryTypes): Flag | undefined => {
        if (type in TransactionTypes && Object.prototype.hasOwnProperty.call(txFlags, type)) {
            return txFlags[type as keyof typeof txFlags];
        }

        if (type in LedgerEntryTypes && Object.prototype.hasOwnProperty.call(objectFlags, type)) {
            return objectFlags[type as keyof typeof objectFlags];
        }

        return undefined;
    };

    private getFlagIndices = (type: TransactionTypes | LedgerEntryTypes): Flag | undefined => {
        switch (type) {
            case TransactionTypes.AccountSet:
                return txFlagIndices.AccountSet;
            case TransactionTypes.AMMDeposit:
                return txFlags.AMMDeposit;
            case TransactionTypes.AMMWithdraw:
                return txFlags.AMMWithdraw;
            default:
                return undefined;
        }
    };

    getIndices() {
        const indices = this.getFlagIndices(this.type);

        if (typeof indices === 'undefined') {
            throw new Error(`type ${this.type} does not include flag indices`);
        }

        const flag = Object.keys(indices).find((flagName) => this.flagsInt === indices[flagName]);

        return flag ?? '';
    }

    setIndices(value: string) {
        const indices = this.getFlagIndices(this.type);

        if (typeof indices === 'undefined') {
            throw new Error(`type ${this.type} does not include flag indices`);
        }

        const flagKey = Object.keys(indices).find((flagName) => flagName === value);

        if (typeof flagKey === 'undefined') {
            throw new Error(`flag indices ${value} not found!`);
        }

        return indices[flagKey];
    }

    get(): ParsedFlags {
        // no flag for this transaction type, just return empty object
        if (typeof this.txFlagsList === 'undefined' || typeof this.flagsInt === 'undefined') {
            return {};
        }

        const settings: ParsedFlags = {};

        // parse transaction flags
        for (const flagName in this.txFlagsList) {
            if (this.flagsInt & this.txFlagsList[flagName]) {
                settings[flagName] = true;
            } else {
                settings[flagName] = false;
            }
        }

        // parse universal flags
        for (const flagName in txFlags.Universal) {
            if (this.flagsInt & txFlags.Universal[flagName]) {
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
     * @param {ParsedFlags} value - The flags to be set. (Object)
     * @throws {Error} - Throws an error if the transaction type does not support setting flags.
     * @returns {number} - The newly set flags value in UInt32.
     */
    set(value: ParsedFlags): number {
        if (typeof this.txFlagsList === 'undefined') {
            throw new Error(`type ${this.type} doesn't not support setting flags!`);
        }

        // TODO: check if the flags are belong to the transaction

        // reset the flags in
        this.flagsInt = 0;

        for (const flagName in value) {
            if (flagName in this.txFlagsList && value[flagName]) {
                this.flagsInt |= this.txFlagsList[flagName];
                // JavaScript converts operands to 32-bit signed Int before doing Bit-wise
                // operations. We need to convert it back to an unsigned int.
                this.flagsInt >>>= 0;
            }
        }

        return this.flagsInt;
    }
}

/* Export ==================================================================== */
export default FlagParser;
