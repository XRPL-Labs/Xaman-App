import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Hash192 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class MPTokenIssuanceSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.MPTokenIssuanceSet as const;
    public readonly Type = MPTokenIssuanceSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        MPTokenIssuanceID: { required: true, type: Hash192 },
        Holder: { type: AccountID },
    };

    declare MPTokenIssuanceID: FieldReturnType<typeof Hash192>;
    declare Holder: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = MPTokenIssuanceSet.Type;
    }
}

/* Export ==================================================================== */
export default MPTokenIssuanceSet;
