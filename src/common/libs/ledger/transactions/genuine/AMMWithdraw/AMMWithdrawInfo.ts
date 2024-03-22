import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMWithdraw from './AMMWithdrawClass';

/* Descriptor ==================================================================== */
const AMMWithdrawInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammWithdraw');
    },

    getDescription: (tx: AMMWithdraw): string => {
        return `This is an ${tx.Type} transaction, please check the explorer for more information.`;
    },

    getRecipient: (tx: AMMWithdraw, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMWithdrawInfo;
