import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMBid from './AMMBidClass';

/* Descriptor ==================================================================== */
const AMMBidInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammBid');
    },

    getDescription: (tx: AMMBid): string => {
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: AMMBid, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMBidInfo;
