import moment from 'moment-timezone';
import { set, get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';
import { CheckCreate } from '@common/libs/ledger/transactions/genuine/CheckCreate';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class CheckCancel extends BaseTransaction {
    public static Type = TransactionTypes.CheckCancel as const;
    public readonly Type = CheckCancel.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = CheckCancel.Type;
        }

        this.fields = this.fields.concat(['CheckID']);
    }

    get CheckID(): string {
        return get(this, ['tx', 'CheckID'], undefined);
    }

    set Check(check: CheckCreate) {
        set(this, 'check', check);
    }

    get Check(): CheckCreate {
        return get(this, 'check', undefined);
    }

    get isExpired(): boolean {
        const date = get(this, ['Check', 'Expiration'], undefined);
        if (isUndefined(date)) return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default CheckCancel;
