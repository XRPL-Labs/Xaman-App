import CredentialCreate from './CredentialCreate.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CredentialCreateValidation: ValidationType<CredentialCreate> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default CredentialCreateValidation;
