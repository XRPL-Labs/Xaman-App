/**
 * Currency schema v1
 */

/* Schema  ==================================================================== */
const CurrencySchema = {
    schema: {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: 'string',
            issuer: 'string',
            currency: 'string',
            name: 'string?',
            avatar: 'string?',
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },
};

export default CurrencySchema;
