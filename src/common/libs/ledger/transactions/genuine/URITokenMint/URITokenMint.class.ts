import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Amount, Blob, Hash256 } from '@common/libs/ledger/parser/fields';
/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class URITokenMint extends BaseGenuineTransaction {
    public static Type = TransactionTypes.URITokenMint as const;
    public readonly Type = URITokenMint.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        URI: { required: true, type: Blob },
        Digest: { type: Hash256 },
        Destination: { type: AccountID },
        Amount: { type: Amount },
    };

    declare URI: FieldReturnType<typeof Blob>;
    declare Digest: FieldReturnType<typeof Hash256>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = URITokenMint.Type;
    }
}

/* Export ==================================================================== */
export default URITokenMint;
