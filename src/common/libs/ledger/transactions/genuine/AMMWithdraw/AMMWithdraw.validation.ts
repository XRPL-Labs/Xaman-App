import AMMWithdraw from './AMMWithdraw.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const AMMWithdrawValidation: ValidationType<AMMWithdraw> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default AMMWithdrawValidation;
