import { AccountModel } from '@store/models';

import Localize from '@locale';

import ClaimReward from './ClaimRewardClass';
import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
const ClaimRewardInfo = {
    getLabel: (tx: ClaimReward): string => {
        switch (tx.ClaimStatus) {
            case ClaimRewardStatus.OptIn:
                return Localize.t('events.claimReward');
            case ClaimRewardStatus.OptOut:
                return Localize.t('events.claimRewardOptOut');
            default:
                return Localize.t('events.claimReward');
        }
    },

    getDescription: (tx: ClaimReward): string => {
        let content = Localize.t('events.claimRewardExplain');

        if (tx.ClaimStatus === ClaimRewardStatus.OptOut) {
            content += '\n';
            content += Localize.t('events.claimRewardExplainOptOut', { address: tx.Account.address });
        }

        return content;
    },

    getRecipient: (tx: ClaimReward, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default ClaimRewardInfo;
