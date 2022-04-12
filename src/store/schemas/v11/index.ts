import {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    AccountSchema,
    CustomNodeSchema,
} from '@store/schemas/v10/';
// changed
import TrustLineSchema from '@store/schemas/v11/trustLine';

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
