/**
 * Contact Schema v1
 */

/* Schema  ==================================================================== */
const ContactSchema = {
    schema: {
        name: 'Contact',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            address: { type: 'string', indexed: true },
            name: { type: 'string' },
            destinationTag: { type: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default ContactSchema;
