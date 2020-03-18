/**
 * TrustLine transaction Parser
 */

import { get, set, isUndefined, toNumber } from 'lodash';
import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class TrustSet extends BaseTransaction {
    constructor(tx?: LedgerTransactionType) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'TrustSet';
        }

        this.fields = this.fields.concat(['LimitAmount', 'QualityIn', 'QualityOut']);
    }

    get Currency(): string {
        return get(this, ['tx', 'LimitAmount', 'currency'], undefined);
    }

    set Currency(currency: string) {
        set(this, 'tx.LimitAmount.currency', currency);
    }

    get Issuer(): string {
        return get(this, ['tx', 'LimitAmount', 'issuer'], undefined);
    }

    set Issuer(issuer: string) {
        set(this, 'tx.LimitAmount.issuer', issuer);
    }

    get Limit(): number {
        return toNumber(get(this, ['tx', 'LimitAmount', 'value'], 0));
    }

    set Limit(value: number) {
        set(this, 'tx.LimitAmount.value', value);
    }

    get QualityIn(): any {
        return get(this, ['tx', 'QualityIn'], 0);
    }

    get QualityOut(): any {
        return get(this, ['tx', 'QualityOut'], 0);
    }
}

/* Export ==================================================================== */
export default TrustSet;
