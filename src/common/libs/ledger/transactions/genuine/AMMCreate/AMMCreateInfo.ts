import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMCreate from './AMMCreateClass';

/* Descriptor ==================================================================== */
const AMMCreateInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammCreate');
    },

    getDescription: (tx: AMMCreate): string => {
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: AMMCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMCreateInfo;
