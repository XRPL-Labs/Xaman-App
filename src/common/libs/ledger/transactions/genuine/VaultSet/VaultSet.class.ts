import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Blob, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class VaultSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.VaultSet as const;
    public readonly Type = VaultSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        VaultID: { required: true, type: Hash256 },
        Data: { type: Blob },
        AssetsMaximum: { type: Amount },
        DomainID: { type: Hash256 },
    };

    declare VaultID: FieldReturnType<typeof Hash256>;
    declare Data: FieldReturnType<typeof Blob>;
    declare AssetsMaximum: FieldReturnType<typeof Amount>;
    declare DomainID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = VaultSet.Type;
    }
}

/* Export ==================================================================== */
export default VaultSet;
