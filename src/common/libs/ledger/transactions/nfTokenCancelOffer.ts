import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType } from '../types';

/* Class ==================================================================== */
class NFTokenCancelOffer extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenCancelOffer';
        }

        this.fields = this.fields.concat(['NFTokenOffers']);
    }

    get NFTokenOffers(): Array<string> {
        return get(this, ['tx', 'NFTokenOffers']);
    }
}

/* Export ==================================================================== */
export default NFTokenCancelOffer;
