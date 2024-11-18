import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Constants ==================================================================== */
const LedgerEntryFlags = {
    [LedgerEntryTypes.AccountRoot]: {
        lsfAllowTrustLineClawback: 0x80000000,
        lsfDefaultRipple: 0x00800000,
        lsfDepositAuth: 0x01000000,
        lsfDisableMaster: 0x00100000,
        lsfDisallowIncomingCheck: 0x08000000,
        lsfDisallowIncomingNFTokenOffer: 0x04000000,
        lsfDisallowIncomingPayChan: 0x10000000,
        lsfDisallowIncomingTrustline: 0x20000000,
        lsfDisallowXRP: 0x00080000,
        lsfGlobalFreeze: 0x00400000,
        lsfNoFreeze: 0x00200000,
        lsfPasswordSpent: 0x00010000,
        lsfRequireAuth: 0x00040000,
        lsfRequireDestTag: 0x00020000,
    },
    [LedgerEntryTypes.RippleState]: {
        lsfLowReserve: 0x00010000,
        lsfHighReserve: 0x00020000,
        lsfLowAuth: 0x00040000,
        lsfHighAuth: 0x00080000,
        lsfLowNoRipple: 0x00100000,
        lsfHighNoRipple: 0x00200000,
        lsfLowFreeze: 0x00400000,
        lsfHighFreeze: 0x00800000,
    },
    [LedgerEntryTypes.SignerList]: {
        lsfOneOwnerCount: 0x00010000,
    },
    [LedgerEntryTypes.NFTokenOffer]: {
        lsfSellNFToken: 0x00000001,
    },
    [LedgerEntryTypes.Offer]: {
        lsfPassive: 0x00010000,
        lsfSell: 0x00020000,
    },
    [LedgerEntryTypes.URIToken]: {
        lsfBurnable: 0x00000001,
    },
};

export { LedgerEntryFlags };
