/**
 * Account Schema v14
 */

import { AccountTypes } from '@store/types';
import Realm from 'realm';

/* Schema  ==================================================================== */
const AccountSchema = {
    schema: {
        name: 'Account',
        primaryKey: 'address',
        properties: {
            type: { type: 'string', default: AccountTypes.Regular },
            address: { type: 'string', indexed: true },
            label: { type: 'string', default: 'My account' },
            publicKey: 'string?',
            accessLevel: 'string',
            encryptionLevel: 'string',
            encryptionVersion: 'int?',
            additionalInfoString: 'string?',
            order: { type: 'int', default: 0 },
            hidden: { type: 'bool', default: false },
            details: { type: 'list', objectType: 'AccountDetails' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        const coreSettings = newRealm.objects('Core') as any;

        if (!coreSettings.isEmpty()) {
            // get connected network from settings
            const { network } = coreSettings[0];

            const oldAccounts = oldRealm.objects('Account') as any;
            const newAccounts = newRealm.objects('Account') as any;

            for (let i = 0; i < oldAccounts.length; i++) {
                const newAccount = newAccounts.find((n: any) => n.address === oldAccounts[i].address);
                newAccount.details = [
                    // @ts-ignore
                    newRealm.create('AccountDetails', {
                        id: `${newAccount.address}.${network.id}`,
                        network,
                        balance: oldAccounts[i].balance,
                        ownerCount: oldAccounts[i].ownerCount,
                        sequence: oldAccounts[i].sequence,
                        regularKey: oldAccounts[i].regularKey,
                        domain: undefined,
                        emailHash: undefined,
                        messageKey: undefined,
                        flagsString: JSON.stringify({}),
                        lines: [],
                        registerAt: new Date(),
                        updatedAt: new Date(),
                    }),
                ];
            }
        }
    },
};

export default AccountSchema;
