import {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    ProfileSchema,
    TrustLineSchema,
    CustomNodeSchema,
} from '@store/schemas/v11/';
// changed
import AccountSchema from '@store/schemas/v12/account';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    AccountSchema.migration(oldRealm, newRealm);
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
