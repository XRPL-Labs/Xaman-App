import { schemas as v13Schemas } from '@store/models/schemas/v13';

// + ADDED
import NetworkSchema from '@store/models/schemas/v14/network';
import NodeSchema from '@store/models/schemas/v14/node';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v14/core';
import AccountSchema from '@store/models/schemas/v14/account';
import AccountDetailsSchema from '@store/models/schemas/v14/accountDetails';
import TrustLineSchema from '@store/models/schemas/v14/trustLine';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, ProfileSchema } = v13Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 14;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    // Note: The order is important for this schema version
    [NetworkSchema, NodeSchema, CoreSchema, AccountSchema, TrustLineSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        entry.migration(oldRealm, newRealm);
    });
};
export const schemas = {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    NetworkSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    AccountDetailsSchema,
    TrustLineSchema,
};
