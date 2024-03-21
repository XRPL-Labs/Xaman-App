import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Issue, Amount, STArray } from '@common/libs/ledger/parser/fields';
import { AuthAccounts } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMBid extends BaseGenuineTransaction {
    public static Type = TransactionTypes.AMMBid as const;
    public readonly Type = AMMBid.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Asset: { type: Issue },
        Asset2: { type: Issue },
        BidMin: { type: Amount },
        BidMax: { type: Amount },
        AuthAccounts: { type: STArray, codec: AuthAccounts },
    };

    declare Asset: FieldReturnType<typeof Issue>;
    declare Asset2: FieldReturnType<typeof Issue>;
    declare BidMin: FieldReturnType<typeof Amount>;
    declare BidMax: FieldReturnType<typeof Amount>;
    declare AuthAccounts: FieldReturnType<typeof STArray, typeof AuthAccounts>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AMMBid.Type;
    }
}

/* Export ==================================================================== */
export default AMMBid;
