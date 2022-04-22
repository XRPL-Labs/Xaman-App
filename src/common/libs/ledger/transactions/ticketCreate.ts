import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class TicketCreate extends BaseTransaction {
    public static Type = TransactionTypes.TicketCreate as const;
    public readonly Type = TicketCreate.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = TicketCreate.Type;
        }

        this.fields = this.fields.concat(['TicketCount']);
    }

    get TicketCount(): number {
        return get(this, ['tx', 'TicketCount']);
    }
}

/* Export ==================================================================== */
export default TicketCreate;
