import Localize from '@locale';

import { AccountModel } from '@store/models';

import PaymentChannelAuthorize from './PaymentChannelAuthorize.class';
/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class PaymentChannelAuthorizeInfo extends ExplainerAbstract<PaymentChannelAuthorize> {
    constructor(item: PaymentChannelAuthorize & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('global.paymentChannelAuthorize');
    };

    generateDescription = (): never => {
        throw new Error('PaymentChannelAuthorize Pseudo transaction do not contain description!');
    };

    getParticipants = (): never => {
        throw new Error('PaymentChannelAuthorize Pseudo transactions do not contain participants!');
    };

    getMonetaryDetails = (): never => {
        throw new Error('PaymentChannelAuthorize Pseudo transactions do not contain monetary details!');
    };
}

/* Export ==================================================================== */
export default PaymentChannelAuthorizeInfo;
