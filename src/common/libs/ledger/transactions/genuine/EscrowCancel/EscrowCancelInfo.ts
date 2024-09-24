import { isUndefined } from 'lodash';

import { AccountModel } from '@store/models';

import Localize from '@locale';

import EscrowCancel from './EscrowCancelClass';
import EscrowCreate from '../EscrowCreate/EscrowCreateClass';

/* Descriptor ==================================================================== */
const EscrowCancelInfo = {
    getLabel: (): string => {
        return Localize.t('events.cancelEscrow');
    },

    getDescription: (tx: EscrowCancel): string => {
        // TODO: add more description
        let content = `This is an ${tx.Type} transaction`;

        if (!isUndefined(tx.EscrowID)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasAEscrowId', { escrowId: tx.EscrowID });
        }

        return content;
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
