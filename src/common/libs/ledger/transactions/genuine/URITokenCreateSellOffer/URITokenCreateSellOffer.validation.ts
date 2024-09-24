import URITokenCreateSellOffer from './URITokenCreateSellOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const URITokenCreateSellOfferValidation: ValidationType<URITokenCreateSellOffer> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default URITokenCreateSellOfferValidation;
