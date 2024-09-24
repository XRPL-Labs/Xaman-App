/**
 * User interaction Schema v16
 */

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const UserInteractionSchema = {
    schema: {
        name: 'UserInteraction',
        primaryKey: 'id',
        properties: {
            id: { type: 'objectId' },
            type: { type: 'string' },
            details: { type: 'dictionary', objectType: 'mixed' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default <ExtendedSchemaType>UserInteractionSchema;
