import { LedgerEntryFlags } from '@common/constants/flags';

/* Types ==================================================================== */
import { RippleState } from '@common/libs/ledger/types/ledger';
import { AccountLinesTrustline } from '@common/libs/ledger/types/methods';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Parser ==================================================================== */
const RippleStateToTrustLine = (ledgerEntry: RippleState, account: string): AccountLinesTrustline => {
    const parties = [ledgerEntry.HighLimit, ledgerEntry.LowLimit];
    const [self, counterparty] = ledgerEntry.HighLimit.issuer === account ? parties : parties.reverse();

    const ripplingFlags = [
        (LedgerEntryFlags[LedgerEntryTypes.RippleState]!.lsfHighNoRipple & ledgerEntry.Flags) ===
            LedgerEntryFlags[LedgerEntryTypes.RippleState]!.lsfHighNoRipple,
        (LedgerEntryFlags[LedgerEntryTypes.RippleState]!.lsfLowNoRipple & ledgerEntry.Flags) ===
            LedgerEntryFlags[LedgerEntryTypes.RippleState]!.lsfLowNoRipple,
    ];

    const [no_ripple, no_ripple_peer] =
        ledgerEntry.HighLimit.issuer === account ? ripplingFlags : ripplingFlags.reverse();

    const balance =
        ledgerEntry.HighLimit.issuer === account && ledgerEntry.Balance.value.startsWith('-')
            ? ledgerEntry.Balance.value.slice(1)
            : ledgerEntry.Balance.value;

    const locked_balance =
        ledgerEntry.HighLimit.issuer === account &&
        ledgerEntry?.LockedBalance &&
        ledgerEntry.LockedBalance.value.startsWith('-')
            ? ledgerEntry.LockedBalance.value.slice(1)
            : ledgerEntry?.LockedBalance?.value;

    const lock_count = ledgerEntry.LockCount;

    return {
        account: counterparty.issuer,
        balance,
        lock_count,
        locked_balance,
        currency: self.currency,
        limit: self.value,
        limit_peer: counterparty.value,
        no_ripple,
        no_ripple_peer,
        quality_in: 0,
        quality_out: 0,
    };
};

export { RippleStateToTrustLine };
