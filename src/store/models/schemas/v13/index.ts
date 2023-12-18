import { schemas as v12Schemas } from '@store/models/schemas/v12';

// ~ MODIFIED
import ProfileSchema from '@store/models/schemas/v13/profile';

// = NOT CHANGED
const {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    AccountSchema,
    CustomNodeSchema,
    TrustLineSchema,
} = v12Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 13;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    ProfileSchema.migration(oldRealm, newRealm);
};
export const schemas = {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
    ProfileSchema,
};
