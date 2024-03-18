import { AccountModel } from '@store/models';

import Localize from '@locale';

import AMMVote from './AMMVoteClass';
import Meta from '@common/libs/ledger/parser/meta';

/* Descriptor ==================================================================== */
const AMMVoteInfo = {
    getLabel: (): string => {
        return Localize.t('events.ammVote');
    },

    getDescription: (tx: AMMVote): string => {
        const content = [];

        const ammAccountId = new Meta(tx.MetaData).parseAMMAccountID();

        if (ammAccountId) {
            content.push(`${Localize.t('events.ammAccountId')}: ${ammAccountId}`);
        }

        content.push(`${Localize.t('events.tradingFee')}: ${tx.TradingFee}%`);

        return content.join('\n');
    },

    getRecipient: (tx: AMMVote, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default AMMVoteInfo;
