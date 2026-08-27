import LoanBrokerCoverDeposit from './LoanBrokerCoverDeposit.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const LoanBrokerCoverDepositValidation: ValidationType<LoanBrokerCoverDeposit> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default LoanBrokerCoverDepositValidation;
