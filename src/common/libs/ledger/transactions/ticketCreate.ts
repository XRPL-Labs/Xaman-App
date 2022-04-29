import { get, isUndefined, set } from 'lodash';

import BaseTransaction from './base';

import Meta from '../parser/meta';
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

    set TicketsSequence(sequences: number[]) {
        set(this, 'ticketsSequence', sequences);
    }

    get TicketsSequence(): number[] {
        const ticketsSequence = get(this, 'ticketsSequence', undefined);

        // if we already set the created tickets sequence's return
        if (ticketsSequence) {
            return ticketsSequence;
        }

        // get created tickets sequences from meta
        const sequences = new Meta(this.meta).parseTicketSequences();

        // store the sequences
        this.TicketsSequence = sequences;

        return sequences;
    }
}

/* Export ==================================================================== */
export default TicketCreate;
