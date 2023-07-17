import { schemas as v5Schemas } from '@store/models/schemas/v5';

// ~ MODIFIED
import AccountSchema from '@store/models/schemas/v6/account';
import ProfileSchema from '@store/models/schemas/v6/profile';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, CoreSchema } = v5Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 6;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    AccountSchema.migration(oldRealm, newRealm);
    ProfileSchema.migration(oldRealm, newRealm);
};
export const schemas = {
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ContactSchema,
    CoreSchema,
    AccountSchema,
    ProfileSchema,
};
