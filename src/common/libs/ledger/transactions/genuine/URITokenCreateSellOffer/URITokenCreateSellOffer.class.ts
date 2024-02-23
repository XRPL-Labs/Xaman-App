import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Amount, Hash256 } from '@common/libs/ledger/parser/fields';
/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class URITokenCreateSellOffer extends BaseTransaction {
    public static Type = TransactionTypes.URITokenCreateSellOffer as const;
    public readonly Type = URITokenCreateSellOffer.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        URITokenID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
        Destination: { type: AccountID },
    };

    declare URITokenID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = URITokenCreateSellOffer.Type;
    }
}

/* Export ==================================================================== */
export default URITokenCreateSellOffer;
