import Localize from '@locale';

/* Descriptor ==================================================================== */
const PaymentChannelAuthorizeInfo = {
    getLabel: (): string => {
        return Localize.t('global.paymentChannelAuthorize');
    },

    getDescription: (): string => {
        throw new Error('PaymentChannelAuthorize Pseudo transaction do not contain description!');
    },

    getRecipient: () => {
        throw new Error('SignIn Pseudo transactions do not contain recipient!');
    },
};

/* Export ==================================================================== */
export default PaymentChannelAuthorizeInfo;
