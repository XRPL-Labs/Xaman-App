import {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    AccountSchema,
    CustomNodeSchema,
    TrustLineSchema,
} from '@store/schemas/v12/';

// changed
import ProfileSchema from '@store/schemas/v13/profile';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    ProfileSchema.migration(oldRealm, newRealm);
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
