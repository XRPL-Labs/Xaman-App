import { schemas as v15Schemas } from '@store/models/schemas/v15';

// = ADDED
import AmmPairSchema from '@store/models/schemas/v16/ammPair';
import UserInteractionSchema from '@store/models/schemas/v16/userInteraction';

// ~ MODIFIED
import CurrencySchema from '@store/models/schemas/v16/currency';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    ProfileSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    TrustLineSchema,
    AccountDetailsSchema,
    NetworkSchema,
} = v15Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 16;

export const migration = (oldRealm: Realm, newRealm: Realm) => {
    [CurrencySchema].forEach((entry) => {
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
    ProfileSchema,
    NetworkSchema,
    NodeSchema,
    CoreSchema,
    AccountSchema,
    AccountDetailsSchema,
    TrustLineSchema,
    AmmPairSchema,
    UserInteractionSchema,
};
