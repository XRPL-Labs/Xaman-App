import Vault from './Vault.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const VaultValidation: ValidationType<Vault> = (object: Vault): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default VaultValidation;
