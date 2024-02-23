import EnableAmendment from './EnableAmendment.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const EnableAmendmentValidation: ValidationType<EnableAmendment> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default EnableAmendmentValidation;
