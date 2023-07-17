// + ADDED
import AccountSchema from '@store/models/schemas/v1/account';
import CoreSchema from '@store/models/schemas/v1/core';
import CounterPartySchema from '@store/models/schemas/v1/counterParty';
import CurrencySchema from '@store/models/schemas/v1/currency';
import ProfileSchema from '@store/models/schemas/v1/profile';
import TrustLineSchema from '@store/models/schemas/v1/trustLine';
import ContactSchema from '@store/models/schemas/v1/contact';

/* Exports ==================================================================== */
export const schemaVersion = 1;
export const migration = () => {};
export const schemas = {
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    TrustLineSchema,
    ContactSchema,
    AccountSchema,
    CoreSchema,
};
