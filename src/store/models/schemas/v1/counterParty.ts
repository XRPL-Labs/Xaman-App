/**
 * Counter Parties Schema v1
 */

/* Schema  ==================================================================== */
const CounterPartySchema = {
    schema: {
        name: 'CounterParty',
        primaryKey: 'id',
        properties: {
            id: { type: 'int' },
            name: { type: 'string', indexed: true },
            avatar: { type: 'string' },
            domain: { type: 'string' },
            currencies: { type: 'list', objectType: 'Currency' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default CounterPartySchema;
