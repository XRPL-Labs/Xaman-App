import { schemas as v6Schemas } from '@store/models/schemas/v6';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v7/core';
import AccountSchema from '@store/models/schemas/v7/account';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema } = v6Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 7;
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
    AccountSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export const schemas = {
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    TrustLineSchema,
    ContactSchema,
    CoreSchema,
    AccountSchema,
};
