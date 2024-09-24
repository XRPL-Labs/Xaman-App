import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class Import extends BaseTransaction {
    public static Type = TransactionTypes.Import as const;
    public readonly Type = Import.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = Import.Type;
        }

        this.fields = this.fields.concat(['Blob', 'Issuer']);
    }

    get Blob(): string {
        return get(this, ['tx', 'Blob']);
    }

    get Issuer(): string {
        return get(this, ['tx', 'Issuer']);
    }
}

/* Export ==================================================================== */
export default Import;
