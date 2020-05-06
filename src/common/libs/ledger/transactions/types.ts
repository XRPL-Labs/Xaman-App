import {
    BaseTransaction,
    Payment,
    TrustSet,
    OfferCreate,
    OfferCancel,
    AccountSet,
    EscrowCancel,
    EscrowCreate,
    EscrowFinish,
    SetRegularKey,
    SignerListSet,
} from '.';

/**
 * Parsed Transactions type
 */
export type TransactionsType =
    | BaseTransaction
    | Payment
    | TrustSet
    | OfferCreate
    | OfferCancel
    | AccountSet
    | EscrowCancel
    | EscrowCreate
    | EscrowFinish
    | SetRegularKey
    | SignerListSet;
