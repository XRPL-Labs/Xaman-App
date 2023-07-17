import { schemas as v10Schemas } from '@store/models/schemas/v10';

// ~ MODIFIED
import TrustLineSchema from '@store/models/schemas/v11/trustLine';

// = NOT CHANGED
const {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    AccountSchema,
    CustomNodeSchema,
} = v10Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 11;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    TrustLineSchema.migration(oldRealm, newRealm);
};
export const schemas = {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
};
