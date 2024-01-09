import { isUndefined } from 'lodash';

import BasePseudoTransaction from '@common/libs/ledger/transactions/pseudo/BasePseudo';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class SignIn extends BasePseudoTransaction {
    public static Type = PseudoTransactionTypes.SignIn as const;
    public readonly Type = SignIn.Type;

    constructor(tx?: TransactionJson) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = PseudoTransactionTypes.SignIn;
        }

        this.fields = this.fields.concat([]);
    }
}

/* Export ==================================================================== */
export default SignIn;
