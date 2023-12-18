/**
 * Account Schema v1
 */

import { ExtendedSchemaType } from '@store/types';
/* Schema  ==================================================================== */

const AccountSchema = {
    schema: {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'Personal account' },
            balance: { type: 'double', default: 0 },
            ownerCount: { type: 'int', default: 0 },
            sequence: { type: 'int', default: 0 },
            publicKey: { type: 'string', optional: true },
            regularKey: { type: 'string', optional: true },
            accessLevel: { type: 'string' },
            encryptionLevel: { type: 'string' },
            flags: { type: 'int', default: 0 },
            default: { type: 'bool', default: false },
            lines: { type: 'list', objectType: 'TrustLine' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },
};

export default <ExtendedSchemaType>AccountSchema;
