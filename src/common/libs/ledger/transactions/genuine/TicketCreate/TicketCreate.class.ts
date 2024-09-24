import Meta from '@common/libs/ledger/parser/meta';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { UInt32 } from '@common/libs/ledger/parser/fields';
/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class TicketCreate extends BaseGenuineTransaction {
    public static Type = TransactionTypes.TicketCreate as const;
    public readonly Type = TicketCreate.Type;

    private _ticketsSequence?: number[];

    public static Fields: { [key: string]: FieldConfig } = {
        TicketCount: { required: true, type: UInt32 },
    };

    declare TicketCount: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = TicketCreate.Type;
    }

    set TicketsSequence(sequences: number[]) {
        this._ticketsSequence = sequences;
    }

    get TicketsSequence(): number[] {
        const ticketsSequence = this._ticketsSequence;

        // if we already set the created tickets sequence's return
        if (ticketsSequence) {
            return ticketsSequence;
        }

        // get created tickets sequences from meta
        const sequences = new Meta(this._meta).parseTicketSequences();

        // store the sequences
        this.TicketsSequence = sequences;

        return sequences;
    }
}

/* Export ==================================================================== */
export default TicketCreate;
