import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PermissionedDomainDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.PermissionedDomainDelete as const;
    public readonly Type = PermissionedDomainDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        DomainID: { type: Hash256 },
    };

    declare DomainID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = PermissionedDomainDelete.Type;
    }
}

/* Export ==================================================================== */
export default PermissionedDomainDelete;
