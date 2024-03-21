import { schemas as v8Schemas } from '@store/models/schemas/v8';

// ~ MODIFIED
import TrustLineSchema from '@store/models/schemas/v9/trustLine';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
} = v8Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 9;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [TrustLineSchema].forEach((entry) => {
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
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
    TrustLineSchema,
};
