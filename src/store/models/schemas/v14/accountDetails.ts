/**
 * Account Details Schema
 */

/* Schema  ==================================================================== */
const AccountDetailsSchema = {
    schema: {
        name: 'AccountDetails',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            network: { type: 'object', objectType: 'Network' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            regularKey: { type: 'string', optional: true },
            domain: { type: 'string', optional: true },
            emailHash: { type: 'string', optional: true },
            messageKey: { type: 'string', optional: true },
            flagsString: { type: 'string', optional: true },
            lines: { type: 'list', objectType: 'TrustLine' },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'details' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default AccountDetailsSchema;
