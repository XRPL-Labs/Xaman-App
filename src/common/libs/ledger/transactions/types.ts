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
    AMMCreate,
    AMMDelete,
    AMMDeposit,
    AMMWithdraw,
    AMMVote,
    AMMBid,
    Remit,
    GenesisMint,
    EnableAmendment,
} from '.';

import { SignIn, PaymentChannelAuthorize } from './pseudo';

// Mixing
import { SignMixinType, MutationsMixinType } from '@common/libs/ledger/mixin/types';

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
    | URITokenCancelSellOffer
    | AMMCreate
    | AMMDelete
    | AMMDeposit
    | AMMWithdraw
    | AMMVote
    | AMMBid
    | Remit
    | GenesisMint
    | EnableAmendment;

/**
 * Pseudo Transactions types
 */
export type PseudoTransactions = SignIn | PaymentChannelAuthorize;

/**
 * Genuine + Pseudo Transactions types
 */
export type CombinedTransactions = Transactions | PseudoTransactions;

/**
 * Mixed Transactions
 */
export type SignableTransaction = CombinedTransactions & SignMixinType;
export type MutatedTransaction = CombinedTransactions & MutationsMixinType;
export type SignableMutatedTransaction = CombinedTransactions & SignMixinType & MutationsMixinType;
