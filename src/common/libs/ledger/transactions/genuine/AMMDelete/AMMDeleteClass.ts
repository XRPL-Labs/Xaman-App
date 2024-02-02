import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { IssueType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class AMMDelete extends BaseTransaction {
    public static Type = TransactionTypes.AMMDelete as const;
    public readonly Type = AMMDelete.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AMMDelete.Type;
        }

        this.fields = this.fields.concat(['Asset', 'Asset2']);
    }

    get Asset(): IssueType {
        return get(this, ['tx', 'Asset']);
    }

    get Asset2(): IssueType {
        return get(this, ['tx', 'Asset2']);
    }
}

/* Export ==================================================================== */
export default AMMDelete;
