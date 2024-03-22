import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class NFTokenBurn extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenBurn as const;
    public readonly Type = NFTokenBurn.Type;

    constructor(tx?: TransactionJson, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = NFTokenBurn.Type;
        }

        this.fields = this.fields.concat(['NFTokenID', 'Owner']);
    }

    get NFTokenID(): string {
        return get(this, ['tx', 'NFTokenID']);
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner']);
    }
}

/* Export ==================================================================== */
export default NFTokenBurn;
