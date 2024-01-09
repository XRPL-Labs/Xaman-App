import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class ClaimReward extends BaseTransaction {
    public static Type = TransactionTypes.ClaimReward as const;
    public readonly Type = ClaimReward.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = ClaimReward.Type;
        }

        this.fields = this.fields.concat(['Issuer']);
    }

    get Issuer(): string {
        return get(this, ['tx', 'Issuer']);
    }

    /**
     * Returns the claim status for the reward.
     *
     * @returns {ClaimRewardStatus} The claim status for the reward.
     */
    get ClaimStatus(): ClaimRewardStatus {
        if (this.Flags?.OptOut) {
            return ClaimRewardStatus.OptOut;
        }

        return ClaimRewardStatus.OptIn;
    }
}

/* Export ==================================================================== */
export default ClaimReward;
