import { AccountModel } from '@store/models';

import Localize from '@locale';

import EscrowFinish from './EscrowFinishClass';

/* Descriptor ==================================================================== */
const EscrowFinishInfo = {
    getLabel: (): string => {
        return Localize.t('events.finishEscrow');
    },

    getDescription: (tx: EscrowFinish): string => {
        let content = Localize.t('events.escrowFinishExplain', {
            address: tx.Account.address,
            amount: tx.Amount.value,
            currency: tx.Amount.currency,
            destination: tx.Destination.address,
        });

        if (tx.Destination.tag) {
            content += '\n';
            content += Localize.t('events.theEscrowHasADestinationTag', { tag: tx.Destination.tag });
            content += ' ';
        }

        content += '\n';
        content += Localize.t('events.theEscrowWasCreatedBy', { owner: tx.Owner });

        return content;
    },

    getRecipient: (tx: EscrowFinish, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Owner === account.address) {
            return tx.Destination;
        }
        return {
            address: tx.Owner,
        };
    },
};

/* Export ==================================================================== */
export default EscrowFinishInfo;
