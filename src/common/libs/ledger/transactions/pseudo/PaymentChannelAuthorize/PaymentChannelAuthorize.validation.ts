import PaymentChannelAuthorize from './PaymentChannelAuthorize.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validator ==================================================================== */
const PaymentChannelAuthorizeValidation: ValidationType<PaymentChannelAuthorize> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default PaymentChannelAuthorizeValidation;
