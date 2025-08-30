import { schemas as v20Schemas } from '@store/models/schemas/v20';

// ~ MODIFIED
import ProfileSchema from '@store/models/schemas/v21/profile';

// = NOT CHANGED
const {
    CurrencySchema,
    ContactSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
    NetworkSchema,
    AmmPairSchema,
    UserInteractionSchema,
} = v20Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 21;

export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [ProfileSchema].forEach((entry) => {
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
