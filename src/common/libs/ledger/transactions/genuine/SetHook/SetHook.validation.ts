import SetHook from './SetHook.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const SetHookValidation: ValidationType<SetHook> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default SetHookValidation;
