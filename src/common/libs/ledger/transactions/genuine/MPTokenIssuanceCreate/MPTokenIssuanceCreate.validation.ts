import MPTokenIssuanceCreate from './MPTokenIssuanceCreate.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenIssuanceCreateValidation: ValidationType<MPTokenIssuanceCreate> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default MPTokenIssuanceCreateValidation;
