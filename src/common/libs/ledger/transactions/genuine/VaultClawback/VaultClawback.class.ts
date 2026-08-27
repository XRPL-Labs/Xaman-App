import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount, AccountID } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class VaultClawback extends BaseGenuineTransaction {
    public static Type = TransactionTypes.VaultClawback as const;
    public readonly Type = VaultClawback.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        VaultID: { required: true, type: Hash256 },
        Holder: { required: true, type: AccountID },
        Amount: { required: true, type: Amount },
    };

    declare VaultID: FieldReturnType<typeof Hash256>;
    declare Holder: FieldReturnType<typeof AccountID>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = VaultClawback.Type;
    }
}

/* Export ==================================================================== */
export default VaultClawback;
