import { AccountModel } from '@store/models';

import Localize from '@locale';

import SignerListSet from './SignerListSetClass';

/* Descriptor ==================================================================== */
const SignerListSetInfo = {
    getLabel: (): string => {
        return Localize.t('events.setSignerList');
    },

    getDescription: (tx: SignerListSet): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: SignerListSet, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default SignerListSetInfo;
