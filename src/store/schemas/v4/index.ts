import { ContactSchema, AccountSchema } from '@store/schemas/v3';
// changed
import CoreSchema from '@store/schemas/v4/core';
import CounterPartySchema from '@store/schemas/v4/counterParty';
import CurrencySchema from '@store/schemas/v4/currency';
import TrustLineSchema from '@store/schemas/v4/trustLine';
import ProfileSchema from '@store/schemas/v4/profile';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
    CounterPartySchema.migration(oldRealm, newRealm);
    CurrencySchema.migration(oldRealm, newRealm);
    TrustLineSchema.migration(oldRealm, newRealm);
    ProfileSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
