import MPTokenIssuanceDestroy from './MPTokenIssuanceDestroy.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenIssuanceDestroyValidation: ValidationType<MPTokenIssuanceDestroy> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default MPTokenIssuanceDestroyValidation;
