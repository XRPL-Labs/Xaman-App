import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Transaction Flags ==================================================================== */
export enum LoanPayFlags {
    tfLoanOverpayment = 65536,
    tfLoanFullPayment = 131072,
}

/* Class ==================================================================== */
class LoanPay extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanPay as const;
    public readonly Type = LoanPay.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
        Flags: { type: UInt32 },
    };

    declare LoanID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanPay.Type;
    }

    get isOverpayment(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanPayFlags.tfLoanOverpayment);
    }

    get isFullPayment(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanPayFlags.tfLoanFullPayment);
    }
}

/* Export ==================================================================== */
export default LoanPay;
