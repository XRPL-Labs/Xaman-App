import { AccountModel } from '@store/models';

import Localize from '@locale';

import Import from './ImportClass';

/* Descriptor ==================================================================== */
const ImportInfo = {
    getLabel: (): string => {
        return Localize.t('events.import');
    },

    getDescription: (tx: Import): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: Import, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default ImportInfo;
