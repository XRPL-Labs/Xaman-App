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
        (LedgerEntryFlags[LedgerEntryTypes.RippleState]!.HighNoRipple & ledgerEntry.Flags) ===
            LedgerEntryFlags[LedgerEntryTypes.RippleState]!.HighNoRipple,
        (LedgerEntryFlags[LedgerEntryTypes.RippleState]!.LowNoRipple & ledgerEntry.Flags) ===
            LedgerEntryFlags[LedgerEntryTypes.RippleState]!.LowNoRipple,
    ];
    const [no_ripple, no_ripple_peer] =
        ledgerEntry.HighLimit.issuer === account ? ripplingFlags : ripplingFlags.reverse();

    const balance =
        ledgerEntry.HighLimit.issuer === account && ledgerEntry.Balance.value.startsWith('-')
            ? ledgerEntry.Balance.value.slice(1)
            : ledgerEntry.Balance.value;

    return {
        account: counterparty.issuer,
        balance,
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
