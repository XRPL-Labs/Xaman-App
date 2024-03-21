import NFTokenOffer from './NFTokenOffer.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const NFTokenOfferValidation: ValidationType<NFTokenOffer> = (object: NFTokenOffer): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default NFTokenOfferValidation;
