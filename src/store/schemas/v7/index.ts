import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    AccountSchema,
    ProfileSchema,
} from '@store/schemas/v6/';
// changed
import CoreSchema from '@store/schemas/v7/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
