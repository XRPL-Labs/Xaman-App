import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

import { Amount, AccountID, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { NFTokenOffer as NFTokenOfferEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenOffer extends BaseLedgerObject<NFTokenOfferEntry> {
    public static Type = LedgerEntryTypes.NFTokenOffer as const;
    public readonly Type = NFTokenOffer.Type;

    public static Fields = {
        Owner: { type: AccountID },
        Amount: { type: Amount },
        Destination: { type: AccountID },
        Expiration: { type: UInt32, codec: RippleTime },
        NFTokenID: { type: Hash256 },
        NFTokenOfferNode: { type: UInt64 },
        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare NFTokenID: FieldReturnType<typeof Hash256>;
    declare NFTokenOfferNode: FieldReturnType<typeof UInt64>;

    declare Owner: FieldReturnType<typeof AccountID>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;

    constructor(object: NFTokenOfferEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.NFTokenOffer;
    }

    get Date(): string | undefined {
        return this.Expiration;
    }

    /*
     NOTE: as all classed and objects have Account field we normalize this object as the rest
     */
    get Account() {
        return this.Owner;
    }
}

/* Export ==================================================================== */
export default NFTokenOffer;
