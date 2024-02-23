import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Issue, UInt16 } from '@common/libs/ledger/parser/fields';
import { TradingFee } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMVote extends BaseTransaction {
    public static Type = TransactionTypes.AMMVote as const;
    public readonly Type = AMMVote.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Asset: { type: Issue },
        Asset2: { type: Issue },
        TradingFee: { type: UInt16, codec: TradingFee },
    };

    declare Asset: FieldReturnType<typeof Issue>;
    declare Asset2: FieldReturnType<typeof Issue>;
    declare TradingFee: FieldReturnType<typeof UInt16, typeof TradingFee>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction
        this.TransactionType = AMMVote.Type;
    }
}

/* Export ==================================================================== */
export default AMMVote;
