import VaultDeposit from './VaultDeposit.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const VaultDepositValidation: ValidationType<VaultDeposit> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default VaultDepositValidation;
