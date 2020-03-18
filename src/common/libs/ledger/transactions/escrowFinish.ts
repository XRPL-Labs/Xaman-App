import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class EscrowFinish extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'EscrowFinish';
        }

        this.fields = this.fields.concat(['Owner', 'OfferSequence', 'Condition', 'Fulfillment']);
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner']);
    }

    get Fulfillment(): number {
        return get(this, ['tx', 'Fulfillment']);
    }

    get Condition(): string {
        return get(this, ['tx', 'Condition']);
    }

    get OfferSequence(): string {
        return get(this, ['tx', 'OfferSequence']);
    }
}

/* Export ==================================================================== */
export default EscrowFinish;
