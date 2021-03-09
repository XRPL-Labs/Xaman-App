import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class TicketCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'TicketCreate';
        }

        this.fields = this.fields.concat(['TicketCount']);
    }

    get TicketCount(): number {
        return get(this, ['tx', 'TicketCount']);
    }
}

/* Export ==================================================================== */
export default TicketCreate;
