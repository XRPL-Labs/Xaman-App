import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { STArray, AccountID } from '@common/libs/ledger/parser/fields';
import { AuthorizeCredentials } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class DepositPreauth extends BaseGenuineTransaction {
    public static Type = TransactionTypes.DepositPreauth as const;
    public readonly Type = DepositPreauth.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Authorize: { type: AccountID },
        Unauthorize: { type: AccountID },
        AuthorizeCredentials: { type: STArray, codec: AuthorizeCredentials },
        UnauthorizeCredentials: { type: STArray, codec: AuthorizeCredentials },
    };

    declare Authorize: FieldReturnType<typeof AccountID>;
    declare Unauthorize: FieldReturnType<typeof AccountID>;
    declare AuthorizeCredentials: FieldReturnType<typeof STArray, typeof AuthorizeCredentials>;
    declare UnauthorizeCredentials: FieldReturnType<typeof STArray, typeof AuthorizeCredentials>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = DepositPreauth.Type;
    }
}

/* Export ==================================================================== */
export default DepositPreauth;
