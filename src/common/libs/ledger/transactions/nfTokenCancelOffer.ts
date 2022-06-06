import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class NFTokenCancelOffer extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenCancelOffer as const;
    public readonly Type = NFTokenCancelOffer.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
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
