import NFTokenCreateOffer from './NFTokenCreateOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenCreateOfferValidation: ValidationType<NFTokenCreateOffer> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default NFTokenCreateOfferValidation;
