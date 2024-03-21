import { NFTokenOffer } from '@common/libs/ledger/objects';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { DeletedNode, TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenAcceptOffer extends BaseGenuineTransaction {
    public static Type = TransactionTypes.NFTokenAcceptOffer as const;
    public readonly Type = NFTokenAcceptOffer.Type;

    private _offerObject?: NFTokenOffer;

    public static Fields: { [key: string]: FieldConfig } = {
        NFTokenSellOffer: { type: Hash256 },
        NFTokenBuyOffer: { type: Hash256 },
        NFTokenBrokerFee: { type: Amount },
    };

    declare NFTokenSellOffer: FieldReturnType<typeof Hash256>;
    declare NFTokenBuyOffer: FieldReturnType<typeof Hash256>;
    declare NFTokenBrokerFee: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenAcceptOffer.Type;
    }

    set Offer(offer: NFTokenOffer) {
        this._offerObject = offer;
    }

    get Offer(): NFTokenOffer {
        // if we already set the token id return
        if (this._offerObject) {
            return this._offerObject;
        }

        // if not look at the metadata for token id
        const affectedNodes = this._meta?.AffectedNodes;
        const deletedNFTokenOfferNode = affectedNodes?.find(
            (node) => 'DeletedNode' in node && node?.DeletedNode?.LedgerEntryType === 'NFTokenOffer',
        ) as DeletedNode;

        const offer: any = deletedNFTokenOfferNode?.DeletedNode?.FinalFields;

        if (offer) {
            this.Offer = new NFTokenOffer(offer);
        }

        return this.Offer;
    }
}

/* Export ==================================================================== */
export default NFTokenAcceptOffer;
