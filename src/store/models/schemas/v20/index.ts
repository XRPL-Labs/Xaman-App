import { schemas as v19Schemas } from '@store/models/schemas/v19';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v20/core';

// = NOT CHANGED
const {
    CurrencySchema,
    ContactSchema,
    ProfileSchema,
    NodeSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
    NetworkSchema,
    AmmPairSchema,
    UserInteractionSchema,
} = v19Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 20;

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
