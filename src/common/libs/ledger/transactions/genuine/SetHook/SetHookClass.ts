import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class SetHook extends BaseTransaction {
    public static Type = TransactionTypes.SetHook as const;
    public readonly Type = SetHook.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
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
