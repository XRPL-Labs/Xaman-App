import moment from 'moment-timezone';

import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';
import { CheckCreate } from '@common/libs/ledger/transactions/genuine/CheckCreate';

import { Hash256, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CheckCash extends BaseTransaction {
    public static Type = TransactionTypes.CheckCash as const;
    public readonly Type = CheckCash.Type;

    private _checkObject?: CheckCreate;

    public static Fields: { [key: string]: FieldConfig } = {
        CheckID: { required: true, type: Hash256 },
        Amount: { type: Amount },
        DeliverMin: { type: Amount },
    };

    declare CheckID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare DeliverMin: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CheckCash.Type;
    }

    set Check(check: CheckCreate) {
        this._checkObject = check;
    }

    get Check(): CheckCreate | undefined {
        let checkObject = this._checkObject;

        // if we already set the check return
        if (checkObject) {
            return checkObject;
        }
        // if not look at the metadata for check object
        const affectedNodes = this._meta?.AffectedNodes ?? [];
        affectedNodes.map((node) => {
            if ('DeletedNode' in node && node.DeletedNode?.LedgerEntryType === 'Check') {
                checkObject = new CheckCreate(node.DeletedNode.FinalFields as any);
            }
            return true;
        });

        return checkObject;
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
export default CheckCash;
