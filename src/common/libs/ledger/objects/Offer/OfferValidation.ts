import Offer from '@common/libs/ledger/objects/Offer/OfferClass';

/* Validator ==================================================================== */
const OfferValidation = (object: Offer): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not container validation!`));
    });
};

/* Export ==================================================================== */
export default OfferValidation;
