import EscrowFinish from './EscrowFinish.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const EscrowFinishValidation: ValidationType<EscrowFinish> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default EscrowFinishValidation;
