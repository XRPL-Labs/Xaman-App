import EscrowCreate from './EscrowCreate.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const EscrowCreateValidation: ValidationType<EscrowCreate> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default EscrowCreateValidation;
