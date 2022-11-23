import {
    CoreSchema,
    ContactSchema,
    CounterPartySchema,
    ProfileSchema,
    TrustLineSchema,
    CustomNodeSchema,
} from '@store/schemas/v11/';
// changed
import AccountSchema from '@store/schemas/v12/account';
import CurrencySchema from '@store/schemas/v12/currency';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    AccountSchema.migration(oldRealm, newRealm);
    CurrencySchema.migration(oldRealm, newRealm);
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
