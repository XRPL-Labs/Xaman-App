/**
 * Account Trust Lines Schema v1
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const TrustLineSchema = {
    schema: {
        name: 'TrustLine',
        properties: {
            currency: { type: 'object', objectType: 'Currency' },
            balance: { type: 'double', default: 0 },
            transfer_rate: { type: 'double', default: 0 },
            no_ripple: { type: 'bool', optional: true },
            no_ripple_peer: { type: 'bool', optional: true },
            limit: { type: 'double', default: 0 },
            quality_in: { type: 'double', default: 0 },
            quality_out: { type: 'double', default: 0 },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'lines' },
        },
    },
};

export default <ExtendedSchemaType>TrustLineSchema;
