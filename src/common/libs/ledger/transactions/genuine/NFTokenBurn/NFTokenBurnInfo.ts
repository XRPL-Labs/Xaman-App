import { AccountModel } from '@store/models';

import Localize from '@locale';

import NFTokenBurn from './NFTokenBurnClass';

/* Descriptor ==================================================================== */
const NFTokenBurnInfo = {
    getLabel: (): string => {
        return Localize.t('events.burnNFT');
    },

    getDescription: (tx: NFTokenBurn): string => {
        return Localize.t('events.nftokenBurnExplain', { tokenID: tx.NFTokenID });
    },

    getRecipient: (tx: NFTokenBurn, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default NFTokenBurnInfo;
