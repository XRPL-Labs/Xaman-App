import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class VaultDeposit extends BaseGenuineTransaction {
    public static Type = TransactionTypes.VaultDeposit as const;
    public readonly Type = VaultDeposit.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        VaultID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
    };

    declare VaultID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = VaultDeposit.Type;
    }
}

/* Export ==================================================================== */
export default VaultDeposit;
