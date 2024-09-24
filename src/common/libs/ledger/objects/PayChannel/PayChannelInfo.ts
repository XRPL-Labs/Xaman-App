import Localize from '@locale';

import { AccountModel } from '@store/models/objects';

import { PaymentChannelCreateInfo } from '@common/libs/ledger/transactions/genuine/PaymentChannelCreate';

import PayChannel from '@common/libs/ledger/objects/PayChannel/PayChannelClass';

/* Descriptor ==================================================================== */
const PayChannelInfo = {
    getLabel: (): string => {
        return Localize.t('events.paymentChannel');
    },

    getDescription: PaymentChannelCreateInfo.getDescription,

    getRecipient: (object: PayChannel, account: AccountModel) => {
        if (object.Account.address !== account.address) {
            return object.Account;
        }

        return object.Destination;
    },
};

/* Export ==================================================================== */
export default PayChannelInfo;
