/**
 * Currency schema v1
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const CurrencySchema = {
    schema: {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            issuer: { type: 'string' },
            currency: { type: 'string' },
            name: { type: 'string', optional: true },
            avatar: { type: 'string', optional: true },
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    },
};

export default <ExtendedSchemaType>CurrencySchema;
