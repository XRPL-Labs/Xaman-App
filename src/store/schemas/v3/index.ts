import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    AccountSchema,
} from '@store/schemas/v2/';

// changed
import CoreSchema from '@store/schemas/v3/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
