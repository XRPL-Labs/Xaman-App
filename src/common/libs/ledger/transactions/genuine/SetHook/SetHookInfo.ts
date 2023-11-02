import { AccountModel } from '@store/models';

import Localize from '@locale';

import SetHook from './SetHookClass';

/* Descriptor ==================================================================== */
const SetHookInfo = {
    getLabel: (): string => {
        return Localize.t('events.setHooks');
    },

    getDescription: (tx: SetHook): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: SetHook, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default SetHookInfo;
