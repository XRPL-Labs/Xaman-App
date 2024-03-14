import moment from 'moment-timezone';

import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Amount, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { Check as CheckLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Check extends BaseLedgerObject<CheckLedgerEntry> {
    public static Type = LedgerEntryTypes.Check as const;
    public readonly Type = Check.Type;

    public static Fields = {
        Account: { type: AccountID },
        DestinationTag: { type: UInt32 },
        Destination: { type: AccountID },
        SourceTag: { type: UInt32 },
        Expiration: { type: UInt32, codec: RippleTime },
        InvoiceID: { type: Hash256 },
        SendMax: { type: Amount },
        DestinationNode: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        Sequence: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare SourceTag: FieldReturnType<typeof UInt32>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare InvoiceID: FieldReturnType<typeof Hash256>;
    declare SendMax: FieldReturnType<typeof Amount>;
    declare DestinationNode: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare Sequence: FieldReturnType<typeof UInt32>;

    constructor(object: CheckLedgerEntry) {
        super(object);

        // set entry type
        this.LedgerEntryType = LedgerEntryTypes.Check;
    }

    get Date(): string {
        return this.Expiration;
    }

    get isExpired(): boolean {
        const date = this.Expiration;

        if (typeof date === 'undefined') return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default Check;
