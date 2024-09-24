import URITokenCancelSellOffer from './URITokenCancelSellOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const URITokenCancelSellOfferValidation: ValidationType<URITokenCancelSellOffer> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default URITokenCancelSellOfferValidation;
