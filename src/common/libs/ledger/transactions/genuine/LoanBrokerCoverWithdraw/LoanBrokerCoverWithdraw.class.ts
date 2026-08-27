import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount, AccountID } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanBrokerCoverWithdraw extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanBrokerCoverWithdraw as const;
    public readonly Type = LoanBrokerCoverWithdraw.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanBrokerID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
        Destination: { type: AccountID },
    };

    declare LoanBrokerID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanBrokerCoverWithdraw.Type;
    }
}

/* Export ==================================================================== */
export default LoanBrokerCoverWithdraw;
