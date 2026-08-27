import MPToken from './MPToken.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenValidation: ValidationType<MPToken> = (object: MPToken): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default MPTokenValidation;
