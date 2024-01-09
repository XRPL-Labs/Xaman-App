import { get } from 'lodash';

import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

/* Types ==================================================================== */
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class Ticket extends BaseLedgerObject {
    public static Type = LedgerEntryTypes.Ticket as const;
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
