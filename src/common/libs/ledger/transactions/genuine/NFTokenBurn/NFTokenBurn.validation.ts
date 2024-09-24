import NFTokenBurn from './NFTokenBurn.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenBurnValidation: ValidationType<NFTokenBurn> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default NFTokenBurnValidation;
