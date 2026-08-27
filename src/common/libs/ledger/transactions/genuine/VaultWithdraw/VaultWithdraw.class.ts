import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount, AccountID, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class VaultWithdraw extends BaseGenuineTransaction {
    public static Type = TransactionTypes.VaultWithdraw as const;
    public readonly Type = VaultWithdraw.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        VaultID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
        Destination: { type: AccountID },
        DestinationTag: { type: UInt32 },
    };

    declare VaultID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = VaultWithdraw.Type;
    }
}

/* Export ==================================================================== */
export default VaultWithdraw;
