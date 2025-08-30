import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, STArray, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { Delegate as DelegateLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Delegate extends BaseLedgerObject<DelegateLedgerEntry> {
    public static Type = LedgerEntryTypes.Delegate as const;
    public readonly Type = Delegate.Type;

    public static Fields = {
        Account: { type: AccountID },
        Authorize: { type: AccountID },
        Permissions: { type: STArray },

        OwnerNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
    };

    declare Account: FieldReturnType<typeof AccountID>;
    declare Authorize: FieldReturnType<typeof AccountID>;
    declare Permissions: FieldReturnType<typeof STArray>;

    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;

    constructor(object: DelegateLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Delegate;
    }

    get Date(): undefined {
        return undefined;
    }
}

/* Export ==================================================================== */
export default Delegate;
