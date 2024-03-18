import { AccountModel } from '@store/models';

import Localize from '@locale';

import ClawbackClass from './ClawbackClass';

/* Descriptor ==================================================================== */
const ClawbackInfo = {
    getLabel: (): string => {
        return Localize.t('events.clawback');
    },

    getDescription: (tx: ClawbackClass): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
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
