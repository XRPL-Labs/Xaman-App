/**
 * Base Ledger transaction
 */

import omit from 'lodash/omit';
import { TransactionJson } from '@common/libs/ledger/types/transaction';

/* Types ==================================================================== */
import { FieldConfig } from '@common/libs/ledger/parser/fields/types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';
import { BaseTransaction } from '@common/libs/ledger/transactions/common';

/* Class ==================================================================== */
class BasePseudoTransaction extends BaseTransaction {
    public static InstanceType = InstanceTypes.PseudoTransaction as const;
    public readonly InstanceType = BasePseudoTransaction.InstanceType;

    // common fields are similar to Genuine transaction except Pseudo transactions does not have TransactionType field
    public static CommonFields: { [key: string]: FieldConfig } = omit(BaseTransaction.CommonFields, 'TransactionType');

    declare TransactionType: never;

    /**
     * serialize transaction object to the ledger tx json for signing
     */
    get JsonForSigning(): TransactionJson {
        // shallow copy and filter the fields
        const tx = { ...this._tx } as TransactionJson;
        Object.getOwnPropertyNames(this._tx).forEach((key: string) => {
            if (
                !Object.keys({
                    ...BasePseudoTransaction.CommonFields,
                    ...(this.constructor as typeof BasePseudoTransaction).Fields,
                }).includes(key)
            ) {
                delete tx[key];
            }
        });

        // make sure the TransactionType is not in the json
        // NOTE: PSEUDO transaction DOESN'T have transaction type field
        if ('TransactionType' in tx) {
            throw new Error('Invalid operation: pseudo transactions should not include a TransactionType.');
        }

        return tx;
    }

    get MetaData() {
        return { ...this._meta };
    }
}

/* Export ==================================================================== */
export default BasePseudoTransaction;
