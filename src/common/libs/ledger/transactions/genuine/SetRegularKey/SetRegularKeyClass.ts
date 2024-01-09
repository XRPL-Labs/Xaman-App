import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class SetRegularKey extends BaseTransaction {
    public static Type = TransactionTypes.SetRegularKey as const;
    public readonly Type = SetRegularKey.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = SetRegularKey.Type;
        }

        this.fields = this.fields.concat(['RegularKey']);
    }

    get RegularKey(): string {
        return get(this, ['tx', 'RegularKey']);
    }
}

/* Export ==================================================================== */
export default SetRegularKey;
