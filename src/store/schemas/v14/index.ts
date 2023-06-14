import {
    ContactSchema,
    CounterPartySchema,
    CurrencySchema,
    AccountSchema,
    ProfileSchema,
    TrustLineSchema,
} from '@store/schemas/v13/';

// added
import NetworkSchema from '@store/schemas/v14/network';
import NodeSchema from '@store/schemas/v14/node';
// changed
import CoreSchema from '@store/schemas/v14/core';

/* Migration ==================================================================== */
export const migration = (oldRealm: any, newRealm: any) => {
    // Note: network schema need to migrate first
    NetworkSchema.migration(oldRealm, newRealm);
    NodeSchema.migration(oldRealm, newRealm);
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
    NodeSchema,
    NetworkSchema,
};
