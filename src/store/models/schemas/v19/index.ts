import { schemas as v18Schemas } from '@store/models/schemas/v18';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v19/core';

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
} = v18Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 19;

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
