import { LedgerAmount, HookExecution, HookEmission } from '../common';
import { LedgerEntryTypes } from '../enums';

export enum DiffType {
    CreatedNode = 'CreatedNode',
    ModifiedNode = 'ModifiedNode',
    DeletedNode = 'DeletedNode',
}

export interface CreatedNode {
    LedgerEntryType: LedgerEntryTypes;
    LedgerIndex: string;
    NewFields: Record<string, any>;
}

export interface ModifiedNode {
    LedgerEntryType: LedgerEntryTypes;
    LedgerIndex: string;
    FinalFields?: Record<string, any>;
    PreviousFields?: Record<string, any>;
    PreviousTxnID?: string;
    PreviousTxnLgrSeq?: number;
}

export interface DeletedNode {
    LedgerEntryType: LedgerEntryTypes;
    LedgerIndex: string;
    FinalFields: Record<string, any>;
    PreviousFields: Record<string, any>;
}

export type Node = CreatedNode | ModifiedNode | DeletedNode;

export interface TransactionMetadata {
    AffectedNodes: {
        [DiffType.CreatedNode]?: CreatedNode;
        [DiffType.ModifiedNode]?: ModifiedNode;
        [DiffType.DeletedNode]?: DeletedNode;
    }[];
    DeliveredAmount?: LedgerAmount;
    // "unavailable" possible for transactions before 2014-01-20
    delivered_amount?: LedgerAmount | 'unavailable';
    TransactionIndex: number;
    TransactionResult: string;
    HookExecutions?: { HookExecution: HookExecution }[];
    HookEmissions?: { HookEmission: HookEmission }[];
    // "nftoken_id" is only present in transactions that involve NFTokens
    nftoken_id?: string;
}
