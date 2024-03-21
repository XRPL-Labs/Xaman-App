import { schemas as v3Schemas } from '@store/models/schemas/v3';

// ~ MODIFIED
import CoreSchema from '@store/models/schemas/v4/core';
import CounterPartySchema from '@store/models/schemas/v4/counterParty';
import CurrencySchema from '@store/models/schemas/v4/currency';
import TrustLineSchema from '@store/models/schemas/v4/trustLine';
import ProfileSchema from '@store/models/schemas/v4/profile';

// = NOT CHANGED
const { ContactSchema, AccountSchema } = v3Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 4;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [CoreSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        entry.migration(oldRealm, newRealm);
    });
};
export const schemas = {
    ContactSchema,
    AccountSchema,
    CoreSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
};
