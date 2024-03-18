import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMDeposit from './AMMDepositClass';

/* Descriptor ==================================================================== */
const AMMDepositInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammDeposit');
    },

    getDescription: (tx: AMMDeposit): string => {
        return `This is an ${tx.Type} transaction, please check the explorer for more information.`;
    },

    getRecipient: (tx: AMMDeposit, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMDepositInfo;
