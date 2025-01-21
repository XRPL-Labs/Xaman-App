import CredentialAccept from './CredentialAccept.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CredentialAcceptValidation: ValidationType<CredentialAccept> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default CredentialAcceptValidation;
