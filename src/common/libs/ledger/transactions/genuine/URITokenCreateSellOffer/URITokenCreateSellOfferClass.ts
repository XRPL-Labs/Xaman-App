import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

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
