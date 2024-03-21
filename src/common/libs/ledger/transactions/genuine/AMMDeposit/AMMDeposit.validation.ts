import AMMDeposit from './AMMDeposit.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const AMMDepositValidation: ValidationType<AMMDeposit> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default AMMDepositValidation;
