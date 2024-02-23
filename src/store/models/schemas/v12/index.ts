import { schemas as v11Schemas } from '@store/models/schemas/v11';

// ~ MODIFIED
import AccountSchema from '@store/models/schemas/v12/account';
import CurrencySchema from '@store/models/schemas/v12/currency';
import CoreSchema from '@store/models/schemas/v12/core';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, ProfileSchema, TrustLineSchema, CustomNodeSchema } = v11Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 12;
export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [AccountSchema, CurrencySchema, CoreSchema].forEach((entry) => {
        if (typeof entry.migration !== 'function') {
            throw new Error(`migration method is required for schema ${entry.schema.name}`);
        }

        entry.migration(oldRealm, newRealm);
    });
};
export const schemas = {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
};
