import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt8, UInt32, UInt64, STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { DepositPreauth as DepositPreauthEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { AuthorizeCredentials } from '../../parser/fields/codec';

/* Class ==================================================================== */
class DepositPreauth extends BaseLedgerObject<DepositPreauthEntry> {
    public static Type = LedgerEntryTypes.DepositPreauth as const;
    public readonly Type = DepositPreauth.Type;

    public static Fields = {
        Authorize: { type: AccountID },
        Sequence: { type: UInt32 },
        Flags: { type: UInt32 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        AuthorizeCredentials: { type: STArray, codec: AuthorizeCredentials },
    };

    declare Authorize?: FieldReturnType<typeof AccountID>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare AuthorizeCredentials?: FieldReturnType<typeof STArray, typeof AuthorizeCredentials>;

    constructor(object: DepositPreauthEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.DepositPreauth;
    }

    get Account() {
        return this._object.Account;
    }
}

/* Export ==================================================================== */
export default DepositPreauth;
