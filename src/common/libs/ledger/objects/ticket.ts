import { get } from 'lodash';

import BaseLedgerObject from './base';

/* Types ==================================================================== */
import { LedgerObjectTypes } from '../types';

/* Class ==================================================================== */
class Ticket extends BaseLedgerObject {
    public static Type = LedgerObjectTypes.Ticket as const;
    public readonly Type = Ticket.Type;

    constructor(object?: any) {
        super(object);
    }

    get TicketSequence(): number {
        return get(this, ['object', 'TicketSequence'], undefined);
    }
}

/* Export ==================================================================== */
export default Ticket;
