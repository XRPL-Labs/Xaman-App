import ContactSchema from '@store/schemas/v1/contact';
import AccountSchema from '@store/schemas/v2/account';
import CounterPartySchema from '@store/schemas/v4/counterParty';
import CurrencySchema from '@store/schemas/v4/currency';
import TrustLineSchema from '@store/schemas/v4/trustLine';
import ProfileSchema from '@store/schemas/v4/profile';
// changed
import CoreSchema from '@store/schemas/v5/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
