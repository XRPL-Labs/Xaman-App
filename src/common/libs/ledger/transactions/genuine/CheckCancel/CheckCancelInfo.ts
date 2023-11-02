import { AccountModel } from '@store/models';

import Localize from '@locale';

import CheckCancel from './CheckCancelClass';

/* Descriptor ==================================================================== */
const CheckCancelInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelCheck');
    },

    getDescription: (tx: CheckCancel): string => {
        return Localize.t('events.theTransactionWillCancelCheckWithId', { checkId: tx.CheckID });
    },

    getRecipient: (tx: CheckCancel, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default CheckCancelInfo;
