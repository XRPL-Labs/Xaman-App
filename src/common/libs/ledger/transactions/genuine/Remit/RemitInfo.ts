import { AccountModel } from '@store/models';

import Localize from '@locale';

import Remit from './RemitClass';

/* Descriptor ==================================================================== */
const RemitInfo = {
    getLabel: (): string => {
        return Localize.t('events.remit');
    },

    getDescription: (tx: Remit): string => {
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: Remit, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default RemitInfo;
