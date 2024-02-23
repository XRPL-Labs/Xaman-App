import { TransactionTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';

export type Flag = {
    [key: string]: number;
};

export type TransactionFlags = {
    [key in TransactionTypes]?: Flag;
};

export type LedgerObjectFlags = {
    [key in LedgerEntryTypes]?: Flag;
};
