import Localize from '@locale';

import EscrowCancel from './EscrowCancelClass';
import EscrowCreate from '../EscrowCreate/EscrowCreateClass';
import { AccountModel } from '@store/models';

/* Descriptor ==================================================================== */
const EscrowCancelInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelEscrow');
    },

    getDescription: (tx: EscrowCancel): string => {
        // TODO: add more description
        return `This is an ${tx.Type} transaction`;
    },

    getRecipient: (tx: EscrowCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default EscrowCancelInfo;
