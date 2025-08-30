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
    DelegateSet,
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
    NFTokenModify,
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
    Clawback,
    DIDSet,
    DIDDelete,
    GenesisMint,
    EnableAmendment,
} from '.';

// Pseudo transactions
import { SignIn, PaymentChannelAuthorize } from './pseudo';

// Fallback transaction
import { FallbackTransaction } from './fallback';

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
    | DelegateSet
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
    | NFTokenModify
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
    | Clawback
    | DIDSet
    | DIDDelete
    | GenesisMint
    | EnableAmendment;

/**
 * Pseudo Transactions types
 */
export type PseudoTransactions = SignIn | PaymentChannelAuthorize;

/**
 * Fallback transaction
 */

export { FallbackTransaction };
/**
 * Genuine + Pseudo Transactions types
 */
export type CombinedTransactions = Transactions | PseudoTransactions | FallbackTransaction;

/**
 * Mixed Transactions
 */
export type SignableTransaction = CombinedTransactions & SignMixinType;
export type MutatedTransaction = CombinedTransactions & MutationsMixinType;
export type SignableMutatedTransaction = CombinedTransactions & SignMixinType & MutationsMixinType;
