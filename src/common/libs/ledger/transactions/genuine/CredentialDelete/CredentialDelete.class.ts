import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CredentialDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.CredentialDelete as const;
    public readonly Type = CredentialDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Subject: { type: AccountID },
        Issuer: { type: AccountID },
        CredentialType: { required: true, type: Blob },
    };

    declare Subject: FieldReturnType<typeof AccountID>;
    declare Issuer: FieldReturnType<typeof AccountID>;
    declare CredentialType: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CredentialDelete.Type;
    }
}

/* Export ==================================================================== */
export default CredentialDelete;
