import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { IssueType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import BigNumber from 'bignumber.js';

/* Class ==================================================================== */
class AMMVote extends BaseTransaction {
    public static Type = TransactionTypes.AMMVote as const;
    public readonly Type = AMMVote.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AMMVote.Type;
        }

        this.fields = this.fields.concat(['Asset', 'Asset2', 'TradingFee']);
    }

    get Asset(): IssueType {
        return get(this, ['tx', 'Asset']);
    }

    get Asset2(): IssueType {
        return get(this, ['tx', 'Asset2']);
    }

    get TradingFee(): number {
        const tradingFee = get(this, ['tx', 'TradingFee'], undefined);

        if (isUndefined(tradingFee)) return undefined;

        return new BigNumber(tradingFee).dividedBy(1000).toNumber();
    }
}

/* Export ==================================================================== */
export default AMMVote;
