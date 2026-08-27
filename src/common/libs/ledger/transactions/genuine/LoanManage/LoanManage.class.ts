import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Transaction Flags ==================================================================== */
export enum LoanManageFlags {
    tfLoanDefault = 65536,
    tfLoanImpair = 131072,
    tfLoanUnimpair = 262144,
}

/* Class ==================================================================== */
class LoanManage extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanManage as const;
    public readonly Type = LoanManage.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanID: { required: true, type: Hash256 },
        Flags: { type: UInt32 },
    };

    declare LoanID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanManage.Type;
    }

    get isDefault(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanManageFlags.tfLoanDefault);
    }

    get isImpair(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanManageFlags.tfLoanImpair);
    }

    get isUnimpair(): boolean {
        return !!(this.Flags && typeof this.Flags === 'number' && this.Flags & LoanManageFlags.tfLoanUnimpair);
    }
}

/* Export ==================================================================== */
export default LoanManage;
