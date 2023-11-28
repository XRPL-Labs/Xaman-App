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
    SetHook,
    ClaimReward,
    Invoke,
    Import,
    URITokenMint,
    URITokenBurn,
    URITokenBuy,
    URITokenCreateSellOffer,
    URITokenCancelSellOffer,
} from '.';

import { SignIn, PaymentChannelAuthorize } from './pseudo';

/**
 * Genuine Transactions types
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
    | NFTokenCancelOffer
    | SetHook
    | ClaimReward
    | Invoke
    | Import
    | URITokenMint
    | URITokenBurn
    | URITokenBuy
    | URITokenCreateSellOffer
    | URITokenCancelSellOffer;

/**
 * Pseudo Transactions types
 */
export type PseudoTransactions = SignIn | PaymentChannelAuthorize;
