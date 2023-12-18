import Escrow from './EscrowClass';

/* Validator ==================================================================== */
const EscrowValidation = (object: Escrow): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not container validation!`));
    });
};

/* Export ==================================================================== */
export default EscrowValidation;
