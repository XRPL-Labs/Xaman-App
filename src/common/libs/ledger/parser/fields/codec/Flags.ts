import FlagParser, { ParsedFlags } from '@common/libs/ledger/parser/common/flag';
import { LedgerEntryTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

/* Codec ==================================================================== */
export const Flags = {
    decode: (
        self: { TransactionType: TransactionTypes; LedgerEntryType: LedgerEntryTypes },
        value: number,
    ): ParsedFlags => {
        const type = self.TransactionType || self.LedgerEntryType;

        if (!type) {
            throw new Error('TransactionType or LedgerEntryType is required for parsing flag indices');
        }

        const flagParser = new FlagParser(type, value);
        return flagParser.get();
    },
    encode: (
        self: { TransactionType?: TransactionTypes; LedgerEntryType?: LedgerEntryTypes },
        value: ParsedFlags,
    ): number => {
        const type = self.TransactionType || self.LedgerEntryType;

        if (!type) {
            throw new Error('TransactionType or LedgerEntryType is required for parsing flag indices');
        }

        const flagParser = new FlagParser(type);
        return flagParser.set(value);
    },
};
