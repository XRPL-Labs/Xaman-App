import NFTokenMint from './NFTokenMint.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenMintValidation: ValidationType<NFTokenMint> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default NFTokenMintValidation;
