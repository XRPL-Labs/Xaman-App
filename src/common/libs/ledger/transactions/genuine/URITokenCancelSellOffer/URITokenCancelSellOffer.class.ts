import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class URITokenCancelSellOffer extends BaseTransaction {
    public static Type = TransactionTypes.URITokenCancelSellOffer as const;
    public readonly Type = URITokenCancelSellOffer.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        URITokenID: { required: true, type: Hash256 },
    };

    declare URITokenID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = URITokenCancelSellOffer.Type;
    }
}

/* Export ==================================================================== */
export default URITokenCancelSellOffer;
