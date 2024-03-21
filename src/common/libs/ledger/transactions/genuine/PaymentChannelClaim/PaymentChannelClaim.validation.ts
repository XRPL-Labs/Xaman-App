import PaymentChannelClaim from './PaymentChannelClaim.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const PaymentChannelClaimValidation: ValidationType<PaymentChannelClaim> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default PaymentChannelClaimValidation;
