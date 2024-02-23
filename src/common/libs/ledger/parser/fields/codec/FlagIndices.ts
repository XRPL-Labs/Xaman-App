import { TransactionTypes } from '@common/libs/ledger/types/enums';

import FlagParser from '@common/libs/ledger/parser/common/flag';

/* Codec ==================================================================== */
export const FlagIndices = {
    decode: (self: { TransactionType?: TransactionTypes } & Record<string, unknown>, value: number): string => {
        const type = self.TransactionType;

        if (!type) {
            throw new Error('TransactionType is required for parsing flag indices');
        }

        const flagParser = new FlagParser(type, value);
        return flagParser.getIndices();
    },
    encode: (self: { TransactionType?: TransactionTypes } & Record<string, unknown>, value: string): number => {
        if (!self?.TransactionType) {
            throw new Error('TransactionType is required for parsing flags');
        }

        const flagParser = new FlagParser(self.TransactionType);
        return flagParser.setIndices(value);
    },
};
