import AccountSchema from '@store/schemas/v1/account';
import CoreSchema from '@store/schemas/v1/core';
import CounterPartySchema from '@store/schemas/v1/counterParty';
import CurrencySchema from '@store/schemas/v1/currency';
import ProfileSchema from '@store/schemas/v1/profile';
import TrustLineSchema from '@store/schemas/v1/trustLine';
import ContactSchema from '@store/schemas/v1/contact';

/* Migration ==================================================================== */
export const migration = () => {};

/* Schemas ==================================================================== */
export { CounterPartySchema, CurrencySchema, ProfileSchema, TrustLineSchema, ContactSchema, AccountSchema, CoreSchema };
