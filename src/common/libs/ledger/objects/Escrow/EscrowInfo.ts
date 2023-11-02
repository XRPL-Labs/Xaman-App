import Localize from '@locale';

import Escrow from '@common/libs/ledger/objects/Escrow/EscrowClass';
import { EscrowCreateInfo } from '@common/libs/ledger/transactions/genuine/EscrowCreate';

/* Descriptor ==================================================================== */
const EscrowInfo = {
    getLabel: (): string => {
        return Localize.t('global.escrow');
    },

    getDescription: EscrowCreateInfo.getDescription,

    getRecipient: (object: Escrow) => {
        return object.Destination;
    },
};

/* Export ==================================================================== */
export default EscrowInfo;
