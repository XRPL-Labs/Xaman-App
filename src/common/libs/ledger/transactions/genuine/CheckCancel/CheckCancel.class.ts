import moment from 'moment-timezone';

import { CheckCreate } from '@common/libs/ledger/transactions/genuine/CheckCreate';

import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CheckCancel extends BaseTransaction {
    public static Type = TransactionTypes.CheckCancel as const;
    public readonly Type = CheckCancel.Type;

    private _checkObject?: CheckCreate;

    public static Fields: { [key: string]: FieldConfig } = {
        CheckID: { required: true, type: Hash256 },
    };

    declare CheckID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CheckCancel.Type;
    }

    set Check(check: CheckCreate) {
        this._checkObject = check;
    }

    get Check(): CheckCreate | undefined {
        return this._checkObject;
    }

    get isExpired(): boolean {
        const date = this._checkObject?.Expiration;
        if (typeof date === 'undefined') return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default CheckCancel;
