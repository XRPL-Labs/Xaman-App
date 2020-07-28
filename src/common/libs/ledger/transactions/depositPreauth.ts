import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class DepositPreauth extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'DepositPreauth';
        }

        this.fields = this.fields.concat(['Authorize', 'Unauthorize']);
    }

    get Authorize(): string {
        return get(this, ['tx', 'Authorize']);
    }

    get Unauthorize(): string {
        return get(this, ['tx', 'Unauthorize']);
    }
}

/* Export ==================================================================== */
export default DepositPreauth;
