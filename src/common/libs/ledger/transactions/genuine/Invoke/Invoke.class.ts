import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob, Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Invoke extends BaseGenuineTransaction {
    public static Type = TransactionTypes.Invoke as const;
    public readonly Type = Invoke.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Blob: { type: Blob },
        Destination: { type: AccountID },
        InvoiceID: { type: Hash256 },
    };

    declare Blob: FieldReturnType<typeof Blob>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare InvoiceID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = Invoke.Type;
    }
}

/* Export ==================================================================== */
export default Invoke;
