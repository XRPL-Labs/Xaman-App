import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class URITokenCancelSellOffer extends BaseTransaction {
    public static Type = TransactionTypes.URITokenCancelSellOffer as const;
    public readonly Type = URITokenCancelSellOffer.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = URITokenCancelSellOffer.Type;
        }

        this.fields = this.fields.concat(['URITokenID']);
    }

    get URITokenID(): string {
        return get(this, ['tx', 'URITokenID']);
    }
}

/* Export ==================================================================== */
export default URITokenCancelSellOffer;
