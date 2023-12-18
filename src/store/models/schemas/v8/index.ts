import { schemas as v7Schemas } from '@store/models/schemas/v7';

// + ADDED
import CustomNodeSchema from '@store/models/schemas/v8/customNode';

// = NOT CHANGED
const { ContactSchema, CounterPartySchema, CurrencySchema, TrustLineSchema, ProfileSchema, CoreSchema, AccountSchema } =
    v7Schemas;

/* Exports ==================================================================== */
export const schemaVersion = 8;
export const migration = () => {};
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
