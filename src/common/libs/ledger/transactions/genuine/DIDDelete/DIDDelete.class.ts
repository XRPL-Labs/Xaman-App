import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class DIDDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.DIDDelete as const;
    public readonly Type = DIDDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {};

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = DIDDelete.Type;
    }
}

/* Export ==================================================================== */
export default DIDDelete;
