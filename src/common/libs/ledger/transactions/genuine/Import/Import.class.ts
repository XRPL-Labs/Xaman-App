import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Import extends BaseGenuineTransaction {
    public static Type = TransactionTypes.Import as const;
    public readonly Type = Import.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Blob: { required: true, type: Blob },
        Issuer: { type: AccountID },
        Destination: { type: AccountID },
    };

    declare Blob: FieldReturnType<typeof Blob>;
    declare Issuer: FieldReturnType<typeof AccountID>;
    declare Destination: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = Import.Type;
    }
}

/* Export ==================================================================== */
export default Import;
