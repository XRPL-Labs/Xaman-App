import { AccountModel } from '@store/models';

import Localize from '@locale';

import ClaimReward from './ClaimRewardClass';

/* Descriptor ==================================================================== */
const ClaimRewardInfo = {
    getLabel: (): string => {
        return Localize.t('events.claimReward');
    },

    getDescription: (tx: ClaimReward): string => {
        // TODO: add description
        return `This is a ${tx.Type} transaction`;
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
