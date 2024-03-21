import PaymentChannelCreate from './PaymentChannelCreate.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const PaymentChannelCreateValidation: ValidationType<PaymentChannelCreate> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default PaymentChannelCreateValidation;
