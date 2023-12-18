import Localize from '@locale';

import Check from '@common/libs/ledger/objects/Check/CheckClass';
import { CheckCreateInfo } from '@common/libs/ledger/transactions/genuine/CheckCreate';

/* Descriptor ==================================================================== */
const CheckInfo = {
    getLabel: (): string => {
        return Localize.t('global.check');
    },

    getDescription: CheckCreateInfo.getDescription,

    getRecipient: (object: Check) => {
        return object.Destination;
    },
};

/* Export ==================================================================== */
export default CheckInfo;
