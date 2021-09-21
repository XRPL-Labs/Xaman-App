import BigNumber from 'bignumber.js';
import { get, isUndefined } from 'lodash';

import { HexEncoding } from '@common/utils/string';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class NFTokenMint extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenMint';
        }

        this.fields = this.fields.concat(['Issuer', 'URI', 'TokenTaxon', 'TransferFee']);
    }

    get Issuer(): string {
        return get(this, ['tx', 'Issuer']);
    }

    get URI(): string {
        const uri = get(this, ['tx', 'URI'], undefined);

        if (isUndefined(uri)) return undefined;

        return HexEncoding.toString(uri);
    }

    get TokenTaxon(): number {
        return get(this, ['tx', 'TokenTaxon']);
    }

    get TransferFee(): number {
        const transferFee = get(this, ['tx', 'TransferFee'], undefined);

        if (isUndefined(transferFee)) return undefined;

        return new BigNumber(transferFee).dividedBy(10000000).minus(100).toNumber();
    }

    // get TokenID(): string {
    //     return 'TOKENID';
    // }
}

/* Export ==================================================================== */
export default NFTokenMint;
