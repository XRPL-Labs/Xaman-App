/**
 * Whether an event should be looked up as spam/scam and suppressed when
 * Settings → Hide Spam/Scam events is on.
 *
 * Dimmed (half transparent) rows are a separate UI path: blocked sender and
 * the setting off. This helper only decides client-side hide.
 */
import { TransactionTypes } from '@common/libs/ledger/types/enums';

type TxSlice = {
    TransactionType?: string;
    Account?: string;
    Destination?: string;
};

const INCOMING_CREATE_TYPES: string[] = [
    TransactionTypes.Payment,
    TransactionTypes.CheckCreate,
    TransactionTypes.EscrowCreate,
];

const THIRD_PARTY_LIFECYCLE_TYPES: string[] = [
    TransactionTypes.CheckCancel,
    TransactionTypes.EscrowCancel,
    TransactionTypes.EscrowFinish,
];

const nodeFields = (node: any): Record<string, any> => {
    const entry = node?.ModifiedNode || node?.CreatedNode || node?.DeletedNode;
    return entry?.FinalFields || entry?.NewFields || {};
};

/**
 * True when this tx is in our account_tx because we are RegularKey of the
 * destination — visible on the destination AccountRoot in meta, no extra lookup.
 */
export const isRegularKeyForDestination = (
    tx: TxSlice | undefined,
    myAddress: string,
    affectedNodes?: any[],
): boolean => {
    if (!tx?.Destination || !myAddress || tx.Destination === myAddress) {
        return false;
    }

    return (affectedNodes || []).some((node) => {
        const fields = nodeFields(node);
        return fields.RegularKey === myAddress && fields.Account === tx.Destination;
    });
};

export const shouldLookupAdvisorySender = (
    tx: TxSlice | undefined,
    myAddress: string,
    isMyAccountThroughRegularKey: boolean,
): boolean => {
    if (!tx?.Account || tx.Account === myAddress) {
        return false;
    }

    const type = tx.TransactionType;

    if (INCOMING_CREATE_TYPES.includes(String(type))) {
        return tx.Destination === myAddress || isMyAccountThroughRegularKey;
    }

    if (THIRD_PARTY_LIFECYCLE_TYPES.includes(String(type))) {
        return true;
    }

    return false;
};
