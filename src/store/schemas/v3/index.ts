import CounterPartySchema from '@store/schemas/v1/counterParty';
import CurrencySchema from '@store/schemas/v1/currency';
import ProfileSchema from '@store/schemas/v1/profile';
import TrustLineSchema from '@store/schemas/v1/trustLine';
import ContactSchema from '@store/schemas/v1/contact';
import AccountSchema from '@store/schemas/v2/account';
// changed
import CoreSchema from '@store/schemas/v3/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
