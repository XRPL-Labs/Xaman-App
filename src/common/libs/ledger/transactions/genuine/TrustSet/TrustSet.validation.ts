import TrustSet from './TrustSet.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const TrustSetValidation: ValidationType<TrustSet> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default TrustSetValidation;
