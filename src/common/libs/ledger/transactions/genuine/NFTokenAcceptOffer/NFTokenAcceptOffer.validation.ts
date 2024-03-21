import NFTokenAcceptOffer from './NFTokenAcceptOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenAcceptOfferValidation: ValidationType<NFTokenAcceptOffer> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default NFTokenAcceptOfferValidation;
