import { schemas as v1Schemas } from '@store/models/schemas/v1';

// ~ MODIFIED
import AccountSchema from '@store/models/schemas/v2/account';
import CoreSchema from '@store/models/schemas/v2/core';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema } = v1Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 2;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [AccountSchema, CoreSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        // run migrations
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
