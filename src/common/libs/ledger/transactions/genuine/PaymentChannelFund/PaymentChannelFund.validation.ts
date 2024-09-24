import PaymentChannelFund from './PaymentChannelFund.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const PaymentChannelFundValidation: ValidationType<PaymentChannelFund> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default PaymentChannelFundValidation;
