import SetRegularKey from './SetRegularKey.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const SetRegularKeyValidation: ValidationType<SetRegularKey> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default SetRegularKeyValidation;
