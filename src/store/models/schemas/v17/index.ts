import { schemas as v16Schemas } from '@store/models/schemas/v16';

// ~ MODIFIED
import ProfileSchema from '@store/models/schemas/v17/profile';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    NetworkSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    AccountDetailsSchema,
    TrustLineSchema,
    AmmPairSchema,
    UserInteractionSchema,
} = v16Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 17;
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
    CounterPartySchema,
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
