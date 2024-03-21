/* eslint-disable spellcheck/spell-checker */

import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { LedgerObjectFlags } from '@common/libs/ledger/parser/common/flags/types';

/* Constants ==================================================================== */
const objectFlags: LedgerObjectFlags = {
    [LedgerEntryTypes.AccountRoot]: {
        AllowTrustLineClawback: 0x80000000,
        DefaultRipple: 0x00800000,
        DepositAuth: 0x01000000,
        DisableMaster: 0x00100000,
        DisallowIncomingCheck: 0x08000000,
        DisallowIncomingNFTokenOffer: 0x04000000,
        DisallowIncomingPayChan: 0x10000000,
        DisallowIncomingTrustline: 0x20000000,
        DisallowXRP: 0x00080000,
        GlobalFreeze: 0x00400000,
        NoFreeze: 0x00200000,
        PasswordSpent: 0x00010000,
        RequireAuth: 0x00040000,
        RequireDestTag: 0x00020000,
    },
    [LedgerEntryTypes.RippleState]: {
        LowReserve: 0x00010000,
        HighReserve: 0x00020000,
        LowAuth: 0x00040000,
        HighAuth: 0x00080000,
        LowNoRipple: 0x00100000,
        HighNoRipple: 0x00200000,
        LowFreeze: 0x00400000,
        HighFreeze: 0x00800000,
    },
    [LedgerEntryTypes.SignerList]: {
        OneOwnerCount: 0x00010000,
    },
    [LedgerEntryTypes.NFTokenOffer]: {
        SellNFToken: 0x00000001,
    },
    [LedgerEntryTypes.Offer]: {
        Passive: 0x00010000,
        Sell: 0x00020000,
    },
};

export { objectFlags };
