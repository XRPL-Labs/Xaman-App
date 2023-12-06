import { AccountModel } from '@store/models';
import Localize from '@locale';

import Invoke from './InvokeClass';

/* Descriptor ==================================================================== */
const InvokeInfo = {
    getLabel: (): string => {
        return Localize.t('events.invoke');
    },

    getDescription: (tx: Invoke): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: Invoke, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default InvokeInfo;
