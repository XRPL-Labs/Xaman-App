import { set, find, get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';
import { NFTokenCreateOffer } from '@common/libs/ledger/transactions/genuine/NFTokenCreateOffer';

/* Types ==================================================================== */
import { AmountType, LedgerAmount } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

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

        this.fields = this.fields.concat(['NFTokenSellOffer', 'NFTokenBuyOffer', 'NFTokenBrokerFee']);
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

    get NFTokenSellOffer(): string {
        return get(this, ['tx', 'NFTokenSellOffer']);
    }

    get NFTokenBuyOffer(): string {
        return get(this, ['tx', 'NFTokenBuyOffer']);
    }

    get NFTokenBrokerFee(): AmountType {
        const brokerFee: LedgerAmount = get(this, ['tx', 'NFTokenBrokerFee']);

        if (isUndefined(brokerFee)) return undefined;

        if (typeof brokerFee === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(brokerFee).dropsToNative(),
            };
        }

        return {
            currency: brokerFee.currency,
            value: brokerFee.value,
            issuer: brokerFee.issuer,
        };
    }
}

/* Export ==================================================================== */
export default NFTokenAcceptOffer;
