import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Amount, Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class URITokenBuy extends BaseTransaction {
    public static Type = TransactionTypes.URITokenBuy as const;
    public readonly Type = URITokenBuy.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        URITokenID: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
    };

    declare URITokenID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = URITokenBuy.Type;
    }
}

/* Export ==================================================================== */
export default URITokenBuy;
