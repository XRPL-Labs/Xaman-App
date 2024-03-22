import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class URITokenBurn extends BaseTransaction {
    public static Type = TransactionTypes.URITokenBurn as const;
    public readonly Type = URITokenBurn.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = URITokenBurn.Type;
        }

        this.fields = this.fields.concat(['URITokenID']);
    }

    get URITokenID(): string {
        return get(this, ['tx', 'URITokenID']);
    }
}

/* Export ==================================================================== */
export default URITokenBurn;
