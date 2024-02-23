import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

import { AccountID, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { Ticket as TicketLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Ticket extends BaseLedgerObject<TicketLedgerEntry> {
    public static Type = LedgerEntryTypes.Ticket as const;
    public readonly Type = Ticket.Type;

    public static Fields = {
        Account: { type: AccountID },
        TicketSequence: { type: UInt32 },

        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare TicketSequence: FieldReturnType<typeof UInt32>;

    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;

    constructor(object: TicketLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Ticket;
    }
}

/* Export ==================================================================== */
export default Ticket;
