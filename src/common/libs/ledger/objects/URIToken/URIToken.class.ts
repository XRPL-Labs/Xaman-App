import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { Amount, AccountID, Hash256, UInt32, UInt64, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { URIToken as URITokenEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Class ==================================================================== */
class URIToken extends BaseLedgerObject<URITokenEntry> {
    public static Type = LedgerEntryTypes.URIToken as const;
    public readonly Type = URIToken.Type;

    public static Fields = {
        Owner: { type: AccountID },
        Destination: { type: AccountID },
        Amount: { type: Amount },
        Issuer: { type: AccountID },
        URI: { type: Blob },
        Digest: { type: Hash256 },

        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        LedgerCloseTime: { type: UInt32, codec: RippleTime },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare Issuer: FieldReturnType<typeof AccountID>;
    declare URI: FieldReturnType<typeof Blob>;
    declare Digest: FieldReturnType<typeof Hash256>;

    declare Owner: FieldReturnType<typeof AccountID>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare LedgerCloseTime: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(object: URITokenEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.URIToken;
    }

    get URITokenID(): string {
        return this.Index;
    }

    get Date(): string | undefined {
        return this.LedgerCloseTime;
    }

    /*
     NOTE: as all classed and objects have Account field we normalize this object as the rest
     */
    get Account() {
        return this.Owner;
    }
}

/* Export ==================================================================== */
export default URIToken;
