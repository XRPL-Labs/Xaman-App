import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType } from '../types';

/* Class ==================================================================== */
class NFTokenBurn extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenBurn';
        }

        this.fields = this.fields.concat(['TokenID']);
    }

    get TokenID(): string {
        return get(this, ['tx', 'TokenID']);
    }
}

/* Export ==================================================================== */
export default NFTokenBurn;
