import moment from 'moment-timezone';
import { AccountModel } from '@store/models';

import Localize from '@locale';

import EscrowCreate from './EscrowCreateClass';

/* Descriptor ==================================================================== */
const EscrowCreateInfo = {
    getLabel: (): string => {
        return Localize.t('events.createEscrow');
    },

    getDescription: (tx: EscrowCreate): string => {
        let content = Localize.t('events.theEscrowIsFromTo', {
            account: tx.Account.address,
            destination: tx.Destination.address,
        });
        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theEscrowHasADestinationTag', { tag: tx.Destination.tag });
            content += ' ';
        }
        content += '\n';
        content += Localize.t('events.itEscrowedWithCurrency', {
            amount: tx.Amount.value,
            currency: tx.Amount.currency,
        });

        if (tx.CancelAfter) {
            content += '\n';
            content += Localize.t('events.itCanBeCanceledAfter', { date: moment(tx.CancelAfter).format('LLLL') });
        }

        if (tx.FinishAfter) {
            content += '\n';
            content += Localize.t('events.itCanBeFinishedAfter', { date: moment(tx.FinishAfter).format('LLLL') });
        }

        return content;
    },

    getRecipient: (tx: EscrowCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account?.address !== account.address) {
            return tx.Account;
        }
        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default EscrowCreateInfo;
