import Ticket from '@common/libs/ledger/objects/Ticket/TicketClass';

/* Validator ==================================================================== */
const TicketValidation = (object: Ticket): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not container validation!`));
    });
};

/* Export ==================================================================== */
export default TicketValidation;
