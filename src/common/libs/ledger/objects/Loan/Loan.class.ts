import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { Loan as LoanEntry, LoanFlags } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Loan extends BaseLedgerObject<LoanEntry> {
    public static Type = LedgerEntryTypes.Loan as const;
    public readonly Type = Loan.Type;

    // Note: Amount fields are NOT in Fields because they need to be
    // formatted based on the associated Vault's asset
    public static Fields = {
        LoanBrokerID: { type: Hash256 },
        LoanSequence: { type: UInt32 },
        Borrower: { type: AccountID },
        StartDate: { type: UInt32 },
        PaymentInterval: { type: UInt32 },
        GracePeriod: { type: UInt32 },
        PreviousPaymentDueDate: { type: UInt32 },
        NextPaymentDueDate: { type: UInt32 },
        PaymentRemaining: { type: UInt32 },
        InterestRate: { type: UInt32 },
        LateInterestRate: { type: UInt32 },
        CloseInterestRate: { type: UInt32 },
        OverpaymentInterestRate: { type: UInt32 },
        OverpaymentFee: { type: UInt32 },
        LoanScale: { type: UInt32 },
        Flags: { type: UInt32 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        LoanBrokerNode: { type: UInt64 },
    };

    declare LoanBrokerID: FieldReturnType<typeof Hash256>;
    declare LoanSequence: FieldReturnType<typeof UInt32>;
    declare Borrower: FieldReturnType<typeof AccountID>;
    declare StartDate: FieldReturnType<typeof UInt32>;
    declare PaymentInterval: FieldReturnType<typeof UInt32>;
    declare GracePeriod: FieldReturnType<typeof UInt32>;
    declare PreviousPaymentDueDate: FieldReturnType<typeof UInt32>;
    declare NextPaymentDueDate: FieldReturnType<typeof UInt32>;
    declare PaymentRemaining: FieldReturnType<typeof UInt32>;
    declare InterestRate: FieldReturnType<typeof UInt32>;
    declare LateInterestRate: FieldReturnType<typeof UInt32>;
    declare CloseInterestRate: FieldReturnType<typeof UInt32>;
    declare OverpaymentInterestRate: FieldReturnType<typeof UInt32>;
    declare OverpaymentFee: FieldReturnType<typeof UInt32>;
    declare LoanScale: FieldReturnType<typeof UInt32>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare LoanBrokerNode: FieldReturnType<typeof UInt64>;

    constructor(object: LoanEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Loan;
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

    /**
     * Format seconds to human-readable duration
     */
    formatDuration(seconds: number | undefined): string | undefined {
        if (seconds === undefined) {
            return undefined;
        }
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    // Amount getters from raw object
    get PeriodicPayment(): string | undefined {
        return this._object.PeriodicPayment;
    }

    get PrincipalOutstanding(): string | undefined {
        return this._object.PrincipalOutstanding;
    }

    get TotalValueOutstanding(): string | undefined {
        return this._object.TotalValueOutstanding;
    }

    get ManagementFeeOutstanding(): string | undefined {
        return this._object.ManagementFeeOutstanding;
    }

    get LoanOriginationFee(): string | undefined {
        return this._object.LoanOriginationFee;
    }

    get LoanServiceFee(): string | undefined {
        return this._object.LoanServiceFee;
    }

    get LatePaymentFee(): string | undefined {
        return this._object.LatePaymentFee;
    }

    get ClosePaymentFee(): string | undefined {
        return this._object.ClosePaymentFee;
    }

    // Formatted rate getters
    get InterestRatePercent(): string | undefined {
        return this.formatRate(this.InterestRate);
    }

    get LateInterestRatePercent(): string | undefined {
        return this.formatRate(this.LateInterestRate);
    }

    get CloseInterestRatePercent(): string | undefined {
        return this.formatRate(this.CloseInterestRate);
    }

    get OverpaymentInterestRatePercent(): string | undefined {
        return this.formatRate(this.OverpaymentInterestRate);
    }

    get OverpaymentFeePercent(): string | undefined {
        return this.formatRate(this.OverpaymentFee);
    }

    // Formatted duration getters
    get PaymentIntervalFormatted(): string | undefined {
        return this.formatDuration(this.PaymentInterval);
    }

    get GracePeriodFormatted(): string | undefined {
        return this.formatDuration(this.GracePeriod);
    }

    // Flag-based status getters
    get isDefaulted(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanFlags.lsfLoanDefault);
    }

    get isImpaired(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanFlags.lsfLoanImpaired);
    }
}

/* Export ==================================================================== */
export default Loan;
