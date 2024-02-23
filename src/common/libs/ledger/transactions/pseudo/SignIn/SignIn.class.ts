import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class SignIn extends BaseTransaction {
    public static Type = PseudoTransactionTypes.SignIn as const;
    public readonly Type = SignIn.Type;

    constructor(tx?: TransactionJson) {
        super(tx);
    }
}

/* Export ==================================================================== */
export default SignIn;
