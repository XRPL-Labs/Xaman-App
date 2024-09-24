import { schemas as v14Schemas } from '@store/models/schemas/v14';

// ~ MODIFIED
import NetworkSchema from '@store/models/schemas/v15/network';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
} = v14Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 15;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    // Note: The order is important for this schema version
    NetworkSchema.migration(oldRealm, newRealm);
};
export const populate = (realm: Realm) => {
    [NetworkSchema, NodeSchema, CoreSchema].forEach((schema) => {
        realm.write(() => {
            schema.populate(realm);
        });
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
};
