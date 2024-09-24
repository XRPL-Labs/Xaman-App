import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class NFTokenCancelOffer extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenCancelOffer as const;
    public readonly Type = NFTokenCancelOffer.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = NFTokenCancelOffer.Type;
        }

        this.fields = this.fields.concat(['NFTokenOffers']);
    }

    get NFTokenOffers(): Array<string> {
        return get(this, ['tx', 'NFTokenOffers']);
    }
}

/* Export ==================================================================== */
export default NFTokenCancelOffer;
