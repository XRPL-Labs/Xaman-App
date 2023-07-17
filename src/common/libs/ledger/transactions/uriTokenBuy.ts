import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '../parser/common/amount';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class URITokenBuy extends BaseTransaction {
    public static Type = TransactionTypes.URITokenBuy as const;
    public readonly Type = URITokenBuy.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = URITokenBuy.Type;
        }

        this.fields = this.fields.concat(['URITokenID', 'Amount']);
    }

    get URITokenID(): string {
        return get(this, ['tx', 'URITokenID']);
    }

    get Amount(): AmountType {
        let amount = undefined as AmountType;

        amount = get(this, ['tx', 'Amount']);

        if (isUndefined(amount)) return undefined;

        if (typeof amount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value,
            issuer: amount.issuer,
        };
    }
}

/* Export ==================================================================== */
export default URITokenBuy;
