import LoanBroker from './LoanBroker.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const LoanBrokerValidation: ValidationType<LoanBroker> = (object: LoanBroker): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default LoanBrokerValidation;
