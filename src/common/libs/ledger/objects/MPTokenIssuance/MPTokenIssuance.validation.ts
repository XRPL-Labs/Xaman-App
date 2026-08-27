import MPTokenIssuance from './MPTokenIssuance.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const MPTokenIssuanceValidation: ValidationType<MPTokenIssuance> = (object: MPTokenIssuance): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default MPTokenIssuanceValidation;
