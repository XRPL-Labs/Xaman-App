import EscrowCancel from './EscrowCancel.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const EscrowCancelValidation: ValidationType<EscrowCancel> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default EscrowCancelValidation;
