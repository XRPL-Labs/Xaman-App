import SignIn from './SignIn.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validator ==================================================================== */
const SignInValidation: ValidationType<SignIn> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default SignInValidation;
