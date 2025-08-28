import Credential from './Credential.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CredentialValidation: ValidationType<Credential> = (object: Credential): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default CredentialValidation;
