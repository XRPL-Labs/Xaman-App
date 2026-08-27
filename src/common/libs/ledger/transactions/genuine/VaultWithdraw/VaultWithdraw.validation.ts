import VaultWithdraw from './VaultWithdraw.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const VaultWithdrawValidation: ValidationType<VaultWithdraw> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default VaultWithdrawValidation;
