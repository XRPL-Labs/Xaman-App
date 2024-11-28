/**
 * Currency Schema 18
 */

import Realm from 'realm';

import { ExtendedSchemaType } from '@store/types';

/* Schema  ==================================================================== */
const CurrencySchema = {
    schema: {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            issuer: { type: 'string' },
            name: { type: 'string', optional: true },
            currencyCode: { type: 'string' },
            issuerName: { type: 'string', optional: true },
            issuerAvatarUrl: { type: 'string', optional: true },
            avatarUrl: { type: 'string', optional: true },
            shortlist: { type: 'bool', default: true },
            xappIdentifier: { type: 'string', optional: true },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date(0) },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating Currency schema to v18');

        const oldObjects = oldRealm.objects(CurrencySchema.schema.name) as any;
        const newObjects = newRealm.objects(CurrencySchema.schema.name) as any;

        const orphanObjects = [] as any;

        // clear up orphan currencies
        for (let i = 0; i < newObjects.length; i++) {
            if (newObjects[i].linkingObjectsCount() > 0) {
                newObjects[i].xappIdentifier = oldObjects.find((c: any) => c.id === newObjects[i].id).xapp_identifier;
                newObjects[i].avatarUrl = oldObjects.find((c: any) => c.id === newObjects[i].id).avatar;
                // NOTE: this will force update the token details
                newObjects[i].updatedAt = new Date(0);
            } else {
                orphanObjects.push(newObjects[i]);
            }
        }

        if (orphanObjects.length > 0) {
            newRealm.delete(orphanObjects);
        }
    },
};

export default <ExtendedSchemaType>CurrencySchema;
