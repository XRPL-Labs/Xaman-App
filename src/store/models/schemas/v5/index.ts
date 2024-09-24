import { schemas as v4Schemas } from '@store/models/schemas/v4';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v5/core';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema, AccountSchema } = v4Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 5;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [CoreSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        entry.migration(oldRealm, newRealm);
    });
};
export const schemas = {
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    TrustLineSchema,
    ContactSchema,
    AccountSchema,
    CoreSchema,
};
