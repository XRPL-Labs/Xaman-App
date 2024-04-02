/**
 * AMM Pair Schema v16
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const AMMPairSchema = {
    schema: {
        name: 'AmmPair',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            pairs: { type: 'list', objectType: 'mixed' },
            line: { type: 'object', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default <ExtendedSchemaType>AMMPairSchema;
