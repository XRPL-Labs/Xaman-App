import { schemas as v20Schemas } from '@store/models/schemas/v21';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v22/core';

// = NOT CHANGED
const {
    CurrencySchema,
    ContactSchema,
    NodeSchema,
    ProfileSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
    NetworkSchema,
    AmmPairSchema,
    UserInteractionSchema,
} = v20Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 22;

export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [CoreSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        entry.migration(oldRealm, newRealm);
    });
};

export const schemas = {
    ContactSchema,
    CurrencySchema,
    ProfileSchema,
    NetworkSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    AccountDetailsSchema,
    TrustLineSchema,
    AmmPairSchema,
    UserInteractionSchema,
};
