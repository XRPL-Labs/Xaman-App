import Localize from '@locale';

import DepositPreauth from './DepositPreauthClass';

/* Descriptor ==================================================================== */
const DepositPreauthInfo = {
    getLabel: (tx: DepositPreauth): string => {
        if (tx.Authorize) {
            return Localize.t('events.authorizeDeposit');
        }

        if (tx.Unauthorize) {
            return Localize.t('events.unauthorizeDeposit');
        }

        return tx.Type;
    },

    getDescription: (tx: DepositPreauth): string => {
        if (tx.Authorize) {
            return Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', { address: tx.Authorize });
        }

        if (tx.Unauthorize) {
            return Localize.t('events.itRemovesAuthorizesSendingPaymentsToThisAccount', { address: tx.Unauthorize });
        }

        return 'No description, "Authorize" and "Unauthorize" field has not been set.';
    },

    getRecipient: (tx: DepositPreauth): { address: string; tag?: number } => {
        return {
            address: tx.Authorize || tx.Unauthorize,
        };
    },
};

/* Export ==================================================================== */
export default DepositPreauthInfo;
