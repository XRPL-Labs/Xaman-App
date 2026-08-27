import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt8, UInt16, UInt32, UInt64, Blob, UInt192 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { MPTokenIssuance as MPTokenIssuanceEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class MPTokenIssuance extends BaseLedgerObject<MPTokenIssuanceEntry> {
    public static Type = LedgerEntryTypes.MPTokenIssuance as const;
    public readonly Type = MPTokenIssuance.Type;

    public static Fields = {
        Issuer: { type: AccountID },
        Sequence: { type: UInt32 },
        Flags: { type: UInt32 },
        AssetScale: { type: UInt8 },
        MaximumAmount: { type: UInt64 },
        OutstandingAmount: { type: UInt64 },
        TransferFee: { type: UInt16 },
        MPTokenMetadata: { type: Blob },
        mpt_issuance_id: { type: UInt192 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
    };

    declare Issuer: FieldReturnType<typeof AccountID>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare AssetScale: FieldReturnType<typeof UInt8>;
    declare MaximumAmount: FieldReturnType<typeof UInt64>;
    declare OutstandingAmount: FieldReturnType<typeof UInt64>;
    declare TransferFee: FieldReturnType<typeof UInt16>;
    declare MPTokenMetadata: FieldReturnType<typeof Blob>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare mpt_issuance_id: FieldReturnType<typeof UInt192>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;

    constructor(object: MPTokenIssuanceEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.MPTokenIssuance;
    }

    get Account() {
        return this.Issuer;
    }
}

/* Export ==================================================================== */
export default MPTokenIssuance;
