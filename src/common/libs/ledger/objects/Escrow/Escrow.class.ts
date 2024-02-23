import moment from 'moment-timezone';

import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

import { AccountID, Amount, Blob, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { Escrow as EscrowLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Escrow extends BaseLedgerObject<EscrowLedgerEntry> {
    public static Type = LedgerEntryTypes.Escrow as const;
    public readonly Type = Escrow.Type;

    public static Fields = {
        Account: { type: AccountID },
        Amount: { type: Amount },
        Destination: { type: AccountID },
        DestinationTag: { type: UInt32 },
        SourceTag: { type: UInt32 },
        CancelAfter: { type: UInt32, codec: RippleTime },
        FinishAfter: { type: UInt32, codec: RippleTime },
        Condition: { type: Blob },
        DestinationNode: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        Sequence: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare SourceTag: FieldReturnType<typeof UInt32>;
    declare CancelAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare FinishAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare Condition: FieldReturnType<typeof Blob>;
    declare DestinationNode: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare Sequence: FieldReturnType<typeof UInt32>;

    constructor(object: EscrowLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Escrow;
    }

    get Date(): any {
        return this.FinishAfter || this.CancelAfter;
    }

    get isExpired(): boolean {
        if (typeof this.CancelAfter === 'undefined') return false;

        const exp = moment.utc(this.CancelAfter);
        const now = moment().utc();
        return exp.isBefore(now);
    }

    get canFinish(): boolean {
        if (this.isExpired) {
            return false;
        }
        if (typeof this.FinishAfter === 'undefined') return true;

        const finishAfter = moment.utc(this.FinishAfter);
        const now = moment().utc();

        return now.isAfter(finishAfter);
    }
}

/* Export ==================================================================== */
export default Escrow;
