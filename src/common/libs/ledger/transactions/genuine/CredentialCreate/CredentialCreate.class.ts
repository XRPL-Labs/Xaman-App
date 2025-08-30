import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CredentialCreate extends BaseGenuineTransaction {
    public static Type = TransactionTypes.CredentialCreate as const;
    public readonly Type = CredentialCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Subject: { required: true, type: AccountID },
        CredentialType: { required: true, type: Blob },
        URI: { type: Blob },
        Expiration: { type: UInt32, codec: RippleTime },
    };

    declare Subject: FieldReturnType<typeof AccountID>;
    declare CredentialType: FieldReturnType<typeof Blob>;
    declare URI: FieldReturnType<typeof Blob>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CredentialCreate.Type;
    }
}

/* Export ==================================================================== */
export default CredentialCreate;
