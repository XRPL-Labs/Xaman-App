/**
 * OracleDelete transaction
 */

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class OracleDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.OracleDelete as const;
    public readonly Type = OracleDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        OracleDocumentID: { type: UInt32 },
    };

    declare OracleDocumentID: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = OracleDelete.Type;
    }
}

/* Export ==================================================================== */
export default OracleDelete;
