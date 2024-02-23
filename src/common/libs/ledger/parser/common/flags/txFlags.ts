import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { Flag, TransactionFlags } from '@common/libs/ledger/parser/common/flags/types';

/* Constants ==================================================================== */
const txFlags: TransactionFlags & { Universal: Flag } = {
    // Universal flags can apply to any transaction type
    Universal: {
        FullyCanonicalSig: 0x80000000,
    },
    [TransactionTypes.AccountSet]: {
        RequireDestTag: 0x00010000,
        OptionalDestTag: 0x00020000,
        RequireAuth: 0x00040000,
        OptionalAuth: 0x00080000,
        DisallowXRP: 0x00100000,
        AllowXRP: 0x00200000,
    },
    [TransactionTypes.TrustSet]: {
        SetAuth: 0x00010000,
        SetNoRipple: 0x00020000,
        ClearNoRipple: 0x00040000,
        SetFreeze: 0x00100000,
        ClearFreeze: 0x00200000,
    },

    [TransactionTypes.OfferCreate]: {
        Passive: 0x00010000,
        ImmediateOrCancel: 0x00020000,
        FillOrKill: 0x00040000,
        Sell: 0x00080000,
    },
    [TransactionTypes.Payment]: {
        NoRippleDirect: 0x00010000,
        PartialPayment: 0x00020000,
        LimitQuality: 0x00040000,
    },
    [TransactionTypes.PaymentChannelClaim]: {
        Renew: 0x00010000,
        Close: 0x00020000,
    },
    [TransactionTypes.NFTokenMint]: {
        Burnable: 0x00000001,
        OnlyXRP: 0x00000002,
        TrustLine: 0x00000004,
        Transferable: 0x00000008,
        ApproveTransfers: 0x00000010,
        IssuerCanCancelOffers: 0x00000010,
        IssuerApprovalRequired: 0x00000020,
    },
    [TransactionTypes.NFTokenCreateOffer]: {
        SellToken: 0x00000001,
        Approved: 0x00000002,
    },
    [TransactionTypes.URITokenMint]: {
        Burnable: 0x00000001,
    },
    [TransactionTypes.ClaimReward]: {
        OptOut: 0x00000001,
    },
    AMMDeposit: {
        LPToken: 0x00010000,
        SingleAsset: 0x00080000,
        TwoAsset: 0x00100000,
        OneAssetLPToken: 0x00200000,
        LimitLPToken: 0x00400000,
    },
    AMMWithdraw: {
        LPToken: 0x00010000,
        WithdrawAll: 0x00020000,
        OneAssetWithdrawAll: 0x00040000,
        SingleAsset: 0x00080000,
        TwoAsset: 0x00100000,
        OneAssetLPToken: 0x00200000,
        LimitLPToken: 0x00400000,
    },
};

// The following are integer (as opposed to bit) flags
// that can be set for particular transactions in the
// SetFlag or ClearFlag field
const txFlagIndices: TransactionFlags = {
    [TransactionTypes.AccountSet]: {
        asfRequireDest: 1,
        asfRequireAuth: 2,
        asfDisallowXRP: 3,
        asfDisableMaster: 4,
        asfAccountTxnID: 5,
        asfNoFreeze: 6,
        asfGlobalFreeze: 7,
        asfDefaultRipple: 8,
        asfDepositAuth: 9,
        asfAuthorizedNFTokenMinter: 10,
        asfDisallowIncomingNFTokenOffer: 12,
        asfDisallowIncomingCheck: 13,
        asfDisallowIncomingPayChan: 14,
        asfDisallowIncomingTrustline: 15,
    },
};

export { txFlags, txFlagIndices };
