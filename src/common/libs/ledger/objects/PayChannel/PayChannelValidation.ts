import PayChannel from '@common/libs/ledger/objects/PayChannel/PayChannelClass';

/* Validator ==================================================================== */
const PayChannelValidation = (object: PayChannel): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not container validation!`));
    });
};

/* Export ==================================================================== */
export default PayChannelValidation;
