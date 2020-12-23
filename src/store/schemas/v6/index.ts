import { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, CoreSchema } from '@store/schemas/v5/';
// changed
import AccountSchema from '@store/schemas/v6/account';
import ProfileSchema from '@store/schemas/v6/profile';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    AccountSchema.migration(oldRealm, newRealm);
    ProfileSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
