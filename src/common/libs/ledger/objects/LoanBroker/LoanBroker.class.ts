import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt16, UInt32, UInt64, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { LoanBroker as LoanBrokerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanBroker extends BaseLedgerObject<LoanBrokerEntry> {
    public static Type = LedgerEntryTypes.LoanBroker as const;
    public readonly Type = LoanBroker.Type;

    // Note: DebtTotal, DebtMaximum, CoverAvailable are NOT in Fields
    // because they need to be formatted based on the associated Vault's asset
    public static Fields = {
        Owner: { type: AccountID },
        Account: { type: AccountID },
        VaultID: { type: Hash256 },
        Sequence: { type: UInt32 },
        LoanSequence: { type: UInt32 },
        CoverRateMinimum: { type: UInt32 },
        CoverRateLiquidation: { type: UInt32 },
        ManagementFeeRate: { type: UInt16 },
        OwnerCount: { type: UInt32 },
        Data: { type: Blob },
        Flags: { type: UInt32 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        VaultNode: { type: UInt64 },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare Account: FieldReturnType<typeof AccountID>;
    declare VaultID: FieldReturnType<typeof Hash256>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare LoanSequence: FieldReturnType<typeof UInt32>;
    declare CoverRateMinimum: FieldReturnType<typeof UInt32>;
    declare CoverRateLiquidation: FieldReturnType<typeof UInt32>;
    declare ManagementFeeRate: FieldReturnType<typeof UInt16>;
    declare OwnerCount: FieldReturnType<typeof UInt32>;
    declare Data: FieldReturnType<typeof Blob>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare VaultNode: FieldReturnType<typeof UInt64>;

    constructor(object: LoanBrokerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.LoanBroker;
    }

    /**
     * Format rate from 1/10th basis points to percentage string
     * e.g., 10000 = 1.0%
     */
    formatRate(value: number | undefined): string | undefined {
        if (value === undefined) {
            return undefined;
        }
        return `${(value / 10000).toFixed(2)}%`;
    }

    get DebtTotal(): string | undefined {
        return this._object.DebtTotal;
    }

    get DebtMaximum(): string | undefined {
        return this._object.DebtMaximum;
    }

    get CoverAvailable(): string | undefined {
        return this._object.CoverAvailable;
    }

    get CoverRateMinimumPercent(): string | undefined {
        return this.formatRate(this.CoverRateMinimum);
    }

    get CoverRateLiquidationPercent(): string | undefined {
        return this.formatRate(this.CoverRateLiquidation);
    }

    get ManagementFeeRatePercent(): string | undefined {
        return this.formatRate(this.ManagementFeeRate);
    }
}

/* Export ==================================================================== */
export default LoanBroker;
