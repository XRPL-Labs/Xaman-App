import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, UInt16, UInt32, Amount, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanBrokerSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanBrokerSet as const;
    public readonly Type = LoanBrokerSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        VaultID: { required: true, type: Hash256 },
        LoanBrokerID: { type: Hash256 },
        Flags: { type: UInt32 },
        Data: { type: Blob },
        ManagementFeeRate: { type: UInt16 },
        DebtMaximum: { type: Amount },
        CoverRateMinimum: { type: UInt32 },
        CoverRateLiquidation: { type: UInt32 },
    };

    declare VaultID: FieldReturnType<typeof Hash256>;
    declare LoanBrokerID: FieldReturnType<typeof Hash256>;
    declare Data: FieldReturnType<typeof Blob>;
    declare ManagementFeeRate: FieldReturnType<typeof UInt16>;
    declare DebtMaximum: FieldReturnType<typeof Amount>;
    declare CoverRateMinimum: FieldReturnType<typeof UInt32>;
    declare CoverRateLiquidation: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanBrokerSet.Type;
    }

    get isUpdate(): boolean {
        return !!this.LoanBrokerID;
    }
}

/* Export ==================================================================== */
export default LoanBrokerSet;
