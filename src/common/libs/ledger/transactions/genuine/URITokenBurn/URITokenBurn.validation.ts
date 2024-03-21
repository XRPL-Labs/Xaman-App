import URITokenBurn from './URITokenBurn.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const URITokenBurnValidation: ValidationType<URITokenBurn> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default URITokenBurnValidation;
