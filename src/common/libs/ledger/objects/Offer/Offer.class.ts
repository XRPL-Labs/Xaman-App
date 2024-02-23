import { AmountParser } from '@common/libs/ledger/parser/common';

import NetworkService from '@services/NetworkService';

import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

import { AccountID, Amount, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { Offer as OfferLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Offer extends BaseLedgerObject<OfferLedgerEntry> {
    public static Type = LedgerEntryTypes.Offer as const;
    public readonly Type = Offer.Type;

    public static Fields = {
        Account: { type: AccountID },
        TakerPays: { type: Amount },
        TakerGets: { type: Amount },
        Expiration: { type: UInt32, codec: RippleTime },
        BookDirectory: { type: Hash256 },
        BookNode: { type: UInt64 },
        OfferID: { type: Hash256 },
        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        Sequence: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare TakerPays: FieldReturnType<typeof Amount>;
    declare TakerGets: FieldReturnType<typeof Amount>;
    declare Expiration: FieldReturnType<typeof UInt32>;
    declare BookDirectory: FieldReturnType<typeof Hash256>;
    declare BookNode: FieldReturnType<typeof UInt64>;
    declare OfferID: FieldReturnType<typeof Hash256>;

    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare Sequence: FieldReturnType<typeof UInt32>;

    constructor(object: OfferLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Offer;
    }

    get Rate(): number {
        const gets = Number(this.TakerGets!.value);
        const pays = Number(this.TakerPays!.value);

        let rate = gets / pays;
        rate = this.TakerGets!.currency !== NetworkService.getNativeAsset() ? rate : 1 / rate;

        return new AmountParser(rate, false).toNumber();
    }

    get OfferSequence(): number {
        return this._object.Sequence;
    }
}

/* Export ==================================================================== */
export default Offer;
