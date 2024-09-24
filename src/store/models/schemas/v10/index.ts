import { schemas as v9Schemas } from '@store/models/schemas/v9';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v10/core';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    AccountSchema,
    CustomNodeSchema,
    TrustLineSchema,
} = v9Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 10;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    CoreSchema.migration(oldRealm, newRealm);
};
export const schemas = {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    AccountSchema,
    CustomNodeSchema,
    CoreSchema,
};
