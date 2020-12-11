import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    CoreSchema,
} from '@store/schemas/v5/';
// changed
import AccountSchema from '@store/schemas/v6/account';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    AccountSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
