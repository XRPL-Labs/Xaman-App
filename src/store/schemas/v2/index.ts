import { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema } from '@store/schemas/v1/';

// changed
import AccountSchema from '@store/schemas/v2/account';
import CoreSchema from '@store/schemas/v2/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    AccountSchema.migration(oldRealm, newRealm);
    CoreSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
