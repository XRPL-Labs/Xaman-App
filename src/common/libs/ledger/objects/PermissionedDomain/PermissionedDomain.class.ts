import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, UInt8, UInt32, UInt64, STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { PermissionedDomain as PermissionedDomainEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { AuthorizeCredentials } from '../../parser/fields/codec';

/* Class ==================================================================== */
class PermissionedDomain extends BaseLedgerObject<PermissionedDomainEntry> {
    public static Type = LedgerEntryTypes.PermissionedDomain as const;
    public readonly Type = PermissionedDomain.Type;

    public static Fields = {
        Owner: { type: AccountID },
        Sequence: { type: UInt32 },
        Flags: { type: UInt32 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
        AcceptedCredentials: { type: STArray, codec: AuthorizeCredentials },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare AssetScale: FieldReturnType<typeof UInt8>;
    declare MaximumAmount: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;
    declare AcceptedCredentials: FieldReturnType<typeof STArray, typeof AuthorizeCredentials>;

    constructor(object: PermissionedDomainEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.PermissionedDomain;
    }

    get Account() {
        return this.Owner;
    }
}

/* Export ==================================================================== */
export default PermissionedDomain;
