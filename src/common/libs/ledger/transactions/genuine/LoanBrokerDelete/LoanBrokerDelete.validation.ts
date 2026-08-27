import LoanBrokerDelete from './LoanBrokerDelete.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const LoanBrokerDeleteValidation: ValidationType<LoanBrokerDelete> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default LoanBrokerDeleteValidation;
