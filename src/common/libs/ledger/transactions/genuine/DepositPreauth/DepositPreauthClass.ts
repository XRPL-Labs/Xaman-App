import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class DepositPreauth extends BaseTransaction {
    public static Type = TransactionTypes.DepositPreauth as const;
    public readonly Type = DepositPreauth.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = DepositPreauth.Type;
        }

        this.fields = this.fields.concat(['Authorize', 'Unauthorize']);
    }

    get Authorize(): string {
        return get(this, ['tx', 'Authorize']);
    }

    get Unauthorize(): string {
        return get(this, ['tx', 'Unauthorize']);
    }
}

/* Export ==================================================================== */
export default DepositPreauth;
