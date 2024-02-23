import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Hash256, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class EscrowCancel extends BaseTransaction {
    public static Type = TransactionTypes.EscrowCancel as const;
    public readonly Type = EscrowCancel.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Owner: { type: AccountID },
        OfferSequence: { type: UInt32 },
        EscrowID: { type: Hash256 },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare OfferSequence: FieldReturnType<typeof UInt32>;
    declare EscrowID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = EscrowCancel.Type;
    }
}

/* Export ==================================================================== */
export default EscrowCancel;
