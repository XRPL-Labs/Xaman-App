import { schemas as v15Schemas } from '@store/models/schemas/v15';

// = ADDED
import AmmPairSchema from '@store/models/schemas/v16/ammPair';

// = NOT CHANGED
const {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
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

export const migration = () => {};

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
};
