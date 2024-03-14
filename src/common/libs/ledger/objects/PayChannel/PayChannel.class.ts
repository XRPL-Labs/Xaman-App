import moment from 'moment-timezone';

import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Blob, Amount, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { PayChannel as PayChannelLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PayChannel extends BaseLedgerObject<PayChannelLedgerEntry> {
    public static Type = LedgerEntryTypes.PayChannel as const;
    public readonly Type = PayChannel.Type;

    public static Fields = {
        Account: { type: AccountID },
        Amount: { type: Amount },
        Balance: { type: Amount },
        CancelAfter: { type: UInt32, codec: RippleTime },
        Expiration: { type: UInt32, codec: RippleTime },
        Destination: { type: AccountID },
        DestinationTag: { type: UInt32 },
        SourceTag: { type: UInt32 },
        PublicKey: { type: Blob },
        SettleDelay: { type: UInt32 },
        DestinationNode: { type: UInt64 },
        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Balance: FieldReturnType<typeof Amount>;
    declare CancelAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare PublicKey: FieldReturnType<typeof Blob>;
    declare SettleDelay: FieldReturnType<typeof UInt32>;
    declare SourceTag: FieldReturnType<typeof UInt32>;

    declare DestinationNode: FieldReturnType<typeof UInt64>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;

    constructor(object: PayChannelLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.PayChannel;
    }

    get Date(): string | undefined {
        return this.Expiration;
    }

    get isExpired(): boolean {
        const date = this._object.Expiration;
        if (typeof date === 'undefined') return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default PayChannel;
