import Fallback from './Fallback.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const FallbackValidation: ValidationType<Fallback> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default FallbackValidation;
