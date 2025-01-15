import CredentialDelete from './CredentialDelete.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CredentialDeleteValidation: ValidationType<CredentialDelete> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default CredentialDeleteValidation;
