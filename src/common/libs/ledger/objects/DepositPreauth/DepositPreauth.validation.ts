import DepositPreauth from './DepositPreauth.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const DepositPreauthValidation: ValidationType<DepositPreauth> = (object: DepositPreauth): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default DepositPreauthValidation;
