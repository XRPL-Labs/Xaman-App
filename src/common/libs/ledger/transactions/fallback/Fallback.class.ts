/**
 * Fallback transaction
 */

import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';

/* Types ==================================================================== */
import { FallbackTypes, InstanceTypes } from '@common/libs/ledger/types/enums';
import { BaseTransaction } from '@common/libs/ledger/transactions/common';

/* Class ==================================================================== */
class FallbackTransaction extends BaseTransaction {
    public static InstanceType = InstanceTypes.FallbackTransaction as const;
    public readonly InstanceType = FallbackTransaction.InstanceType;

    public static Type = FallbackTypes.FallbackTransaction;
    public readonly Type = FallbackTransaction.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);
    }

    /**
     * serialize transaction object to the ledger tx json for signing
     */
    get JsonForSigning(): TransactionJson {
        // shallow copy without any filtering
        return { ...this._tx } as TransactionJson;
    }

    get MetaData() {
        return { ...this._meta };
    }
}

/* Export ==================================================================== */
export default FallbackTransaction;
