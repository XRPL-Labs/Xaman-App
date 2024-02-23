import { LedgerAmount, HookExecution, HookEmission } from '../common';

export interface CreatedNode {
    CreatedNode: {
        LedgerEntryType: string;
        LedgerIndex: string;
        NewFields: { [field: string]: unknown };
    };
}

export interface ModifiedNode {
    ModifiedNode: {
        LedgerEntryType: string;
        LedgerIndex: string;
        FinalFields?: { [field: string]: unknown };
        PreviousFields?: { [field: string]: unknown };
        PreviousTxnID?: string;
        PreviousTxnLgrSeq?: number;
    };
}

export interface DeletedNode {
    DeletedNode: {
        LedgerEntryType: string;
        LedgerIndex: string;
        FinalFields: { [field: string]: unknown };
    };
}

export type Node = CreatedNode | ModifiedNode | DeletedNode;

export interface TransactionMetadata {
    AffectedNodes: Node[];
    DeliveredAmount?: LedgerAmount;
    // "unavailable" possible for transactions before 2014-01-20
    delivered_amount?: LedgerAmount | 'unavailable';
    TransactionIndex: number;
    TransactionResult: string;
    HookExecutions?: HookExecution[];
    HookEmissions?: HookEmission[];
    nftoken_id?: string;
}
