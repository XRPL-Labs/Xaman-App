import { AccountModel } from '@store/models';

import Localize from '@locale';

import Import from './ImportClass';
import { isUndefined } from 'lodash';

/* Descriptor ==================================================================== */
const ImportInfo = {
    getLabel: (): string => {
        return Localize.t('events.import');
    },

    getDescription: (tx: Import): string => {
        const { Issuer } = tx;
        let content = Localize.t('events.importTransactionExplain');

        if (!isUndefined(Issuer)) {
            content += '\n';
            content += Localize.t('events.theIssuerIs', { issuer: Issuer });
        }

        return content;
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
