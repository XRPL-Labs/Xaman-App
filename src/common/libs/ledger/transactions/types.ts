import {
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
    AccountDelete,
    CheckCash,
    CheckCancel,
    CheckCreate,
    DepositPreauth,
    TicketCreate,
    PaymentChannelClaim,
    PaymentChannelCreate,
    PaymentChannelFund,
    NFTokenAcceptOffer,
    NFTokenBurn,
    NFTokenCancelOffer,
    NFTokenCreateOffer,
    NFTokenMint,
} from '.';

import { SignIn, PaymentChannelAuthorize } from './pseudo';

/**
 * All Transactions types
 */
export type Transactions =
    | Payment
    | TrustSet
    | AccountDelete
    | AccountSet
    | OfferCreate
    | OfferCancel
    | EscrowCreate
    | EscrowCancel
    | EscrowFinish
    | SetRegularKey
    | SignerListSet
    | DepositPreauth
    | CheckCreate
    | CheckCash
    | CheckCancel
    | TicketCreate
    | PaymentChannelCreate
    | PaymentChannelClaim
    | PaymentChannelFund
    | NFTokenMint
    | NFTokenBurn
    | NFTokenCreateOffer
    | NFTokenAcceptOffer
    | NFTokenCancelOffer;

/**
 * Pseudo Transactions types
 */
export type PseudoTransactions = SignIn | PaymentChannelAuthorize;
