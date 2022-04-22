import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class OfferCancel extends BaseTransaction {
    public static Type = TransactionTypes.OfferCancel as const;
    public readonly Type = OfferCancel.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = OfferCancel.Type;
        }

        this.fields = this.fields.concat(['OfferSequence']);
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence']);
    }
}

/* Export ==================================================================== */
export default OfferCancel;
