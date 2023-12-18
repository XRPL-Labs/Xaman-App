import NFTokenOffer from './NFTokenOfferClass';

/* Validator ==================================================================== */
const NFTokenOfferValidation = (object: NFTokenOffer): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not container validation!`));
    });
};

/* Export ==================================================================== */
export default NFTokenOfferValidation;
