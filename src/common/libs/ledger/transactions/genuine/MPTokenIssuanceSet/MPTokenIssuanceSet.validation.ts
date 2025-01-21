import MPTokenIssuanceSet from './MPTokenIssuanceSet.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenIssuanceSetValidation: ValidationType<MPTokenIssuanceSet> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default MPTokenIssuanceSetValidation;
