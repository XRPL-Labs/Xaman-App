import NFTokenCancelOffer from './NFTokenCancelOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenCancelOfferValidation: ValidationType<NFTokenCancelOffer> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default NFTokenCancelOfferValidation;
