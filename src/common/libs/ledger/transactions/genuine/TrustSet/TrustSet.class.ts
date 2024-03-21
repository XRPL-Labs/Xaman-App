import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Amount, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class TrustSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.TrustSet as const;
    public readonly Type = TrustSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LimitAmount: { required: true, type: Amount },
        QualityIn: { type: UInt32 },
        QualityOut: { type: UInt32 },
    };

    declare LimitAmount: FieldReturnType<typeof Amount>;
    declare QualityIn: FieldReturnType<typeof UInt32>;
    declare QualityOut: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = TrustSet.Type;
    }

    get Currency(): string {
        return (this._tx?.LimitAmount as AmountType).currency;
    }

    get Issuer(): string {
        return (this._tx?.LimitAmount as AmountType).issuer!;
    }

    get Limit(): number {
        return Number((this._tx?.LimitAmount as AmountType).value);
    }
}

/* Export ==================================================================== */
export default TrustSet;
