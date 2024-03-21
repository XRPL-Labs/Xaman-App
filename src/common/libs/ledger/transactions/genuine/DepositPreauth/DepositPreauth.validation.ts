import DepositPreauth from './DepositPreauth.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const DepositPreauthValidation: ValidationType<DepositPreauth> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default DepositPreauthValidation;
