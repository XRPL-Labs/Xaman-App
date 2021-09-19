import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    AccountSchema,
    CustomNodeSchema,
    TrustLineSchema,
} from '@store/schemas/v9/';
// changed
import CoreSchema from '@store/schemas/v10/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    CoreSchema.migration(oldRealm, newRealm);
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
