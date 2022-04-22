import { set, get, find, isUndefined } from 'lodash';

import BaseTransaction from './base';

import Amount from '../parser/common/amount';

import NFTokenCreateOffer from './nfTokenCreateOffer';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class NFTokenAcceptOffer extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenAcceptOffer as const;
    public readonly Type = NFTokenAcceptOffer.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = NFTokenAcceptOffer.Type;
        }

        this.fields = this.fields.concat(['Amount', 'NFTokenSellOffer', 'NFTokenBuyOffer']);
    }

    set Offer(offer: NFTokenCreateOffer) {
        set(this, 'acceptedOffer', offer);
    }

    get Offer(): NFTokenCreateOffer {
        let offer = get(this, 'acceptedOffer', undefined);

        // if we already set the token id return
        if (offer) {
            return offer;
        }

        // if not look at the metadata for token id
        const affectedNodes = get(this.meta, 'AffectedNodes', []);
        offer = get(
            find(affectedNodes, (node) => node.DeletedNode?.LedgerEntryType === 'NFTokenOffer'),
            ['DeletedNode', 'FinalFields'],
            undefined,
        );
        if (offer) {
            this.Offer = new NFTokenCreateOffer(offer);
        }
        return offer;
    }

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

    get NFTokenSellOffer(): string {
        return get(this, ['tx', 'NFTokenSellOffer']);
    }

    get NFTokenBuyOffer(): string {
        return get(this, ['tx', 'NFTokenBuyOffer']);
    }
}

/* Export ==================================================================== */
export default NFTokenAcceptOffer;
