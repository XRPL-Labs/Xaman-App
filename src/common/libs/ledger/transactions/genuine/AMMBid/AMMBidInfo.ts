import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMBid from './AMMBidClass';
import Meta from '@common/libs/ledger/parser/meta';

/* Descriptor ==================================================================== */
const AMMBidInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammBid');
    },

    getDescription: (tx: AMMBid): string => {
        return `This is an ${tx.Type} transaction, please check the explorer for more information.`;
    },

    getRecipient: (tx: AMMBid, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address === account.address) {
            const ammAccountId = new Meta(tx.MetaData).parseAMMAccountID();

            if (ammAccountId) {
                return { address: ammAccountId };
            }
        } else {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMBidInfo;
