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
            name: { type: 'string', optional: true },
            avatar: { type: 'string', optional: true },
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },
};

export default CurrencySchema;
