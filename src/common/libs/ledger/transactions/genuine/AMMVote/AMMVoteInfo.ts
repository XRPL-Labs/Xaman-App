import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMVote from './AMMVoteClass';

/* Descriptor ==================================================================== */
const AMMVoteInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammVote');
    },

    getDescription: (tx: AMMVote): string => {
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: AMMVote, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMVoteInfo;
