import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class SetHook extends BaseTransaction {
    public static Type = TransactionTypes.SetHook as const;
    public readonly Type = SetHook.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = SetHook.Type;
        }

        this.fields = this.fields.concat(['Hooks']);
    }

    get Hooks(): Array<any> {
        return get(this, ['tx', 'Hooks']);
    }
}

/* Export ==================================================================== */
export default SetHook;
