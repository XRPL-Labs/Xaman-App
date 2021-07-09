import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
} from '@store/schemas/v8/';
// changed
import TrustLineSchema from '@store/schemas/v9/trustLine';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    TrustLineSchema.migration(oldRealm, newRealm);
};

/* Schemas ==================================================================== */
export {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    TrustLineSchema,
    ProfileSchema,
    CoreSchema,
    AccountSchema,
    CustomNodeSchema,
};
