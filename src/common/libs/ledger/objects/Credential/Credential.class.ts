import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Blob, Hash256, UInt32, UInt64 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { Credential as CredentialLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Credential extends BaseLedgerObject<CredentialLedgerEntry> {
    public static Type = LedgerEntryTypes.Credential as const;
    public readonly Type = Credential.Type;

    public static Fields = {
        Issuer: { type: AccountID },
        Subject: { type: AccountID },

        URI: { type: Blob },
        CredentialType: { type: Blob },
        Expiration: { type: UInt32 },

        IssuerNode: { type: UInt64 },
        SubjectNode: { type: UInt64 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
    };

    declare Issuer: FieldReturnType<typeof AccountID>;
    declare Subject: FieldReturnType<typeof AccountID>;

    declare URI: FieldReturnType<typeof Blob>;
    declare CredentialType: FieldReturnType<typeof Blob>;
    declare Expiration: FieldReturnType<typeof UInt32>;

    declare IssuerNode: FieldReturnType<typeof UInt64>;
    declare SubjectNode: FieldReturnType<typeof UInt64>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;

    constructor(object: CredentialLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Credential;
    }

    get Date(): undefined {
        return undefined;
    }
}

/* Export ==================================================================== */
export default Credential;
