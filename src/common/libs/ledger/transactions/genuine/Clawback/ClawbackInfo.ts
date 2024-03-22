import { AccountModel } from '@store/models';

import Localize from '@locale';

import ClawbackClass from './ClawbackClass';

/* Descriptor ==================================================================== */
const ClawbackInfo = {
    getLabel: (): string => {
        return Localize.t('events.clawback');
    },

    getDescription: (tx: ClawbackClass): string => {
        return `This is an ${tx.Type} transaction, please check the explorer for more information.`;
    },

    getRecipient: (tx: ClawbackClass, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default ClawbackInfo;
