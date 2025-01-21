import MPTokenAuthorize from './MPTokenAuthorize.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenAuthorizeValidation: ValidationType<MPTokenAuthorize> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default MPTokenAuthorizeValidation;
