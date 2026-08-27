import LoanBrokerSet from './LoanBrokerSet.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const LoanBrokerSetValidation: ValidationType<LoanBrokerSet> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default LoanBrokerSetValidation;
