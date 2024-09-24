import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Field ==================================================================== */
export const LedgerEntryType = {
    getter: (self: any, field: string) => {
        return (): LedgerEntryTypes => {
            return self[field];
        };
    },
    setter: (self: any, field: string) => {
        return (value: any): void => {
            self[field] = value;
        };
    },
};
