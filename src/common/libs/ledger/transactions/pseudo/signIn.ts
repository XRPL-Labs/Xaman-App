import { isUndefined } from 'lodash';

import BasePseudoTransaction from './base';

/* Types ==================================================================== */
import { PseudoTransactionTypes, TransactionJSONType } from '../../types';

/* Class ==================================================================== */
class SignIn extends BasePseudoTransaction {
    public static Type = PseudoTransactionTypes.SignIn as const;
    public readonly Type = SignIn.Type;

    constructor(tx?: TransactionJSONType) {
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
