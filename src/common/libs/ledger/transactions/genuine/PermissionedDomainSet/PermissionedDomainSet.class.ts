import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { STArray, Hash256 } from '@common/libs/ledger/parser/fields';
import { AuthorizeCredentials } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PermissionedDomainSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.PermissionedDomainSet as const;
    public readonly Type = PermissionedDomainSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        DomainID: { type: Hash256 },
        AcceptedCredentials: { type: STArray, codec: AuthorizeCredentials },
    };

    declare DomainID: FieldReturnType<typeof Hash256>;
    declare AcceptedCredentials: FieldReturnType<typeof STArray, typeof AuthorizeCredentials>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = PermissionedDomainSet.Type;
    }
}

/* Export ==================================================================== */
export default PermissionedDomainSet;
