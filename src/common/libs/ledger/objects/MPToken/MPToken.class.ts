import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt32, UInt64, UInt192 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { MPToken as MPTokenEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';

/* Class ==================================================================== */
class MPToken extends BaseLedgerObject<MPTokenEntry> {
    public static Type = LedgerEntryTypes.MPToken as const;
    public readonly Type = MPToken.Type;

    public static Fields = {
        Account: { type: AccountID },
        MPTokenIssuanceID: { type: UInt192 },
        MPTAmount: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare MPTokenIssuanceID: FieldReturnType<typeof UInt192>;
    declare MPTAmount: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;

    constructor(object: MPTokenEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.MPToken;
    }

    get MPTokenID(): string {
        return this.Index;
    }

    // get Balance(): FieldReturnType<typeof UInt64> {
    //     return this.MPTAmount;
    // }

    get Issuer(): FieldReturnType<typeof AccountID> {
        return DecodeMPTokenIssuanceToIssuer(String(this?.MPTokenIssuanceID || ''));
    }
}

/* Export ==================================================================== */
export default MPToken;
