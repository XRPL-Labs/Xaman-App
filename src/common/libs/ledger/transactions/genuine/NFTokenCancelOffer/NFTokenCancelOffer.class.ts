import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenCancelOffer extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenCancelOffer as const;
    public readonly Type = NFTokenCancelOffer.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        NFTokenOffers: { required: true, type: STArray },
    };

    declare NFTokenOffers: FieldReturnType<typeof STArray>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenCancelOffer.Type;
    }
}

/* Export ==================================================================== */
export default NFTokenCancelOffer;
