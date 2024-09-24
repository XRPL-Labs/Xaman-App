import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class DIDSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.DIDSet as const;
    public readonly Type = DIDSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Data: { type: Blob },
        DIDDocument: { type: Blob },
        URI: { type: Blob },
    };

    declare Data: FieldReturnType<typeof Blob>;
    declare DIDDocument: FieldReturnType<typeof Blob>;
    declare URI: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = DIDSet.Type;
    }
}

/* Export ==================================================================== */
export default DIDSet;
