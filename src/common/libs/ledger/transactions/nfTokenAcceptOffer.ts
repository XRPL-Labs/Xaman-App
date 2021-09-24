import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';

import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class NFTokenAcceptOffer extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenAcceptOffer';
        }

        this.fields = this.fields.concat(['Amount', 'SellOffer', 'BuyOffer']);
    }

    // @ts-ignore
    get Amount(): AmountType {
        let amount = undefined as AmountType;

        amount = get(this, ['tx', 'Amount']);

        if (isUndefined(amount)) return undefined;

        if (typeof amount === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(amount).dropsToXrp(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value && new Amount(amount.value, false).toString(),
            issuer: amount.issuer,
        };
    }

    get SellOffer(): string {
        return get(this, ['tx', 'SellOffer']);
    }

    get BuyOffer(): string {
        return get(this, ['tx', 'BuyOffer']);
    }
}

/* Export ==================================================================== */
export default NFTokenAcceptOffer;
