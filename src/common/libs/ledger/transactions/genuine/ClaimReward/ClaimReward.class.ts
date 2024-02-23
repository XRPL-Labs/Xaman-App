import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class ClaimReward extends BaseTransaction {
    public static Type = TransactionTypes.ClaimReward as const;
    public readonly Type = ClaimReward.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Issuer: { type: AccountID },
    };

    declare Issuer: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = ClaimReward.Type;
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
