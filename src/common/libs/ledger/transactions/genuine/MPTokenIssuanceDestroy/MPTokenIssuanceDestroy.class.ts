import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash192 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class MPTokenIssuanceDestroy extends BaseGenuineTransaction {
    public static Type = TransactionTypes.MPTokenIssuanceDestroy as const;
    public readonly Type = MPTokenIssuanceDestroy.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        MPTokenIssuanceID: { required: true, type: Hash192 },
    };

    declare MPTokenIssuanceID: FieldReturnType<typeof Hash192>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = MPTokenIssuanceDestroy.Type;
    }
}

/* Export ==================================================================== */
export default MPTokenIssuanceDestroy;
