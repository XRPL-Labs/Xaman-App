import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class NFTokenCancelOffer extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenCancelOffer';
        }

        this.fields = this.fields.concat(['TokenIDs']);
    }

    get TokenIDs(): Array<string> {
        return get(this, ['tx', 'TokenIDs']);
    }
}

/* Export ==================================================================== */
export default NFTokenCancelOffer;
