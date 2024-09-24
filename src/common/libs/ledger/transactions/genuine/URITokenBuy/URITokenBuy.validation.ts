import URITokenBuy from './URITokenBuy.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const URITokenBuyValidation: ValidationType<URITokenBuy> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default URITokenBuyValidation;
