import { AccountModel } from '@store/models';

import Localize from '@locale';

import EnableAmendment from './EnableAmendmentClass';

/* Descriptor ==================================================================== */
const EnableAmendmentInfo = {
    getLabel: (): string => {
        return Localize.t('events.enableAmendment');
    },

    getDescription: (tx: EnableAmendment): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: EnableAmendment, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default EnableAmendmentInfo;
