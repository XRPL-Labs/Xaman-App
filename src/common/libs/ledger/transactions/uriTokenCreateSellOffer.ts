import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import BaseTransaction from './base';

import Amount from '../parser/common/amount';
/* Types ==================================================================== */
import { Destination, AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class URITokenCreateSellOffer extends BaseTransaction {
    public static Type = TransactionTypes.URITokenCreateSellOffer as const;
    public readonly Type = URITokenCreateSellOffer.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = URITokenCreateSellOffer.Type;
        }

        this.fields = this.fields.concat(['URITokenID', 'Amount', 'Destination']);
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

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: undefined,
        };
    }
}

/* Export ==================================================================== */
export default URITokenCreateSellOffer;
