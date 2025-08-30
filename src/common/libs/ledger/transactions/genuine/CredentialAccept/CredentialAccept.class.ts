import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CredentialAccept extends BaseGenuineTransaction {
    public static Type = TransactionTypes.CredentialAccept as const;
    public readonly Type = CredentialAccept.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Issuer: { required: true, type: AccountID },
        CredentialType: { required: true, type: Blob },
    };

    declare Issuer: FieldReturnType<typeof AccountID>;
    declare CredentialType: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CredentialAccept.Type;
    }
}

/* Export ==================================================================== */
export default CredentialAccept;
