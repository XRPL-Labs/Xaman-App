import { AccountModel } from '@store/models';

import Localize from '@locale';

import GenesisMint from './GenesisMintClass';

/* Descriptor ==================================================================== */
const GenesisMintInfo = {
    getLabel: (): string => {
        return Localize.t('events.genesisMint');
    },

    getDescription: (tx: GenesisMint): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: GenesisMint, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default GenesisMintInfo;
