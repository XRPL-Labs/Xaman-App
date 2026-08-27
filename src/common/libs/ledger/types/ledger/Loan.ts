import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * A Loan ledger object - represents an uncollateralized, fixed-term loan
 *
 * @category Ledger Entries
 */
export default interface Loan extends BaseLedgerEntry, HasPreviousTxnID {
    /** The associated LoanBroker that issued this loan */
    LoanBrokerID: string;
    /** Sequential identifier for the loan within the broker */
    LoanSequence: number;
    /** Account address of the borrowing party */
    Borrower: string;

    // Payment Schedule
    /** Loan initiation timestamp */
    StartDate: number;
    /** Seconds between loan payments */
    PaymentInterval: number;
    /** Seconds after payment due date when loan can be defaulted */
    GracePeriod: number;
    /** Previous payment deadline timestamp */
    PreviousPaymentDueDate?: number;
    /** Upcoming payment deadline timestamp */
    NextPaymentDueDate: number;
    /** Outstanding payment count */
    PaymentRemaining: number;
    /** Standard payment amount */
    PeriodicPayment: string;

    // Principal & Outstanding
    /** Remaining principal balance */
    PrincipalOutstanding: string;
    /** Total amount owed including principal and fees */
    TotalValueOutstanding: string;
    /** Accrued broker management fees */
    ManagementFeeOutstanding?: string;

    // Interest Rates (in 1/10th basis points, 0-100000)
    /** Standard annualized interest rate */
    InterestRate: number;
    /** Premium added to interest rate for late payments */
    LateInterestRate?: number;
    /** Early repayment rate */
    CloseInterestRate?: number;
    /** Interest rate on overpayments */
    OverpaymentInterestRate?: number;

    // Fees (nominal amounts)
    /** Amount deducted from principal at creation */
    LoanOriginationFee?: string;
    /** Amount paid to broker with each payment */
    LoanServiceFee?: string;
    /** Penalty for overdue payments */
    LatePaymentFee?: string;
    /** Early repayment fee */
    ClosePaymentFee?: string;
    /** Fee charged on overpayments in 1/10th basis points */
    OverpaymentFee?: number;

    /** Precision factor for rounding calculations */
    LoanScale?: number;

    /** Directory page hint for borrower */
    OwnerNode?: string;
    /** Directory page hint for loan broker */
    LoanBrokerNode?: string;
    /** Bit-map of boolean flags */
    Flags: number;
}

export enum LoanFlags {
    /** Loan has defaulted */
    lsfLoanDefault = 0x00000001,
    /** Loan has unrealized loss (impaired) */
    lsfLoanImpaired = 0x00000002,
}
