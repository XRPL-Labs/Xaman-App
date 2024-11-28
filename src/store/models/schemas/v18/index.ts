import { schemas as v17Schemas } from '@store/models/schemas/v17';

// ~ MODIFIED
import CurrencySchema from '@store/models/schemas/v18/currency';

// = NOT CHANGED
const {
    ContactSchema,
    ProfileSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
    NetworkSchema,
    AmmPairSchema,
    UserInteractionSchema,
} = v17Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 18;

export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [CurrencySchema].forEach((entry) => {
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
