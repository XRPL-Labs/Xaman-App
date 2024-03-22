import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMDeposit from './AMMDepositClass';
import Meta from '@common/libs/ledger/parser/meta';

/* Descriptor ==================================================================== */
const AMMDepositInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammDeposit');
    },

    getDescription: (tx: AMMDeposit): string => {
        return `This is an ${tx.Type} transaction, please check the explorer for more information.`;
    },

    getRecipient: (tx: AMMDeposit, account: AccountModel): { address: string; tag?: number } => {
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
export default AMMDepositInfo;
