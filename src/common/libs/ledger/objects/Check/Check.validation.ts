import Check from './Check.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CheckValidation: ValidationType<Check> = (object: Check): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default CheckValidation;
