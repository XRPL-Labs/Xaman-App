import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Amount, Hash256, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenCreateOffer extends BaseGenuineTransaction {
    public static Type = TransactionTypes.NFTokenCreateOffer as const;
    public readonly Type = NFTokenCreateOffer.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { required: true, type: Amount },
        NFTokenID: { required: true, type: Hash256 },
        Owner: { type: AccountID },
        Destination: { type: AccountID },
        Expiration: { type: UInt32, codec: RippleTime },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare NFTokenID: FieldReturnType<typeof Hash256>;
    declare Owner: FieldReturnType<typeof AccountID>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenCreateOffer.Type;
    }
}

/* Export ==================================================================== */
export default NFTokenCreateOffer;
