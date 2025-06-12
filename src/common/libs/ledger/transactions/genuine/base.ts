/**
 * Base Ledger transaction
 */

import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';

import { BaseTransaction } from '@common/libs/ledger/transactions/common';
import { TransactionType } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { InstanceTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class BaseGenuineTransaction extends BaseTransaction {
    public static InstanceType = InstanceTypes.GenuineTransaction as const;
    public readonly InstanceType = BaseGenuineTransaction.InstanceType;

    declare TransactionType: FieldReturnType<typeof TransactionType>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata, txFilter?: Function) {
        super(tx, meta, txFilter);
    }

    /**
     * serialize transaction object to the ledger tx json for signing
     * Note: this method will remove any unrecognized field from transaction
     */
    get JsonForSigning(): TransactionJson {
        // shallow copy and filter the fields
        const tx = { ...this._tx } as TransactionJson;
        Object.getOwnPropertyNames(this._tx).forEach((key: string) => {
            if (
                !Object.keys({
                    ...BaseGenuineTransaction.CommonFields,
                    ...(this.constructor as typeof BaseGenuineTransaction).Fields,
                }).includes(key)
            ) {
                delete tx[key];
            }
        });

        if (this?._txFilter && typeof this._txFilter === 'function') {
            try {
                // This has the ability to modify the cloned tx object
                // E.g. used in NFTokenModify to remove Owner field if it's the same as Account
                this._txFilter(tx);
            } catch (e) {
                // ignore
            }
        }

        return tx;
    }

    get JsonRaw(): TransactionJson {
        // shallow copy and filter the fields
        const tx = { ...this._tx } as TransactionJson;

        return tx;
    }

    get MetaData() {
        return { ...this._meta };
    }
}

/* Export ==================================================================== */
export default BaseGenuineTransaction;
