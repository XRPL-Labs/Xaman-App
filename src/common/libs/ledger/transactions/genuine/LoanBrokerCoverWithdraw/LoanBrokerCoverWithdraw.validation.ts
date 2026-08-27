import LoanBrokerCoverWithdraw from './LoanBrokerCoverWithdraw.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const LoanBrokerCoverWithdrawValidation: ValidationType<LoanBrokerCoverWithdraw> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default LoanBrokerCoverWithdrawValidation;
