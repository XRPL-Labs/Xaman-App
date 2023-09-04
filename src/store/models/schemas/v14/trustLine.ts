/**
 * Account Trust Lines Schema v14
 */

import Realm from 'realm';

/* Schema  ==================================================================== */
const TrustLineSchema = {
    schema: {
        name: 'TrustLine',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            currency: { type: 'Currency' },
            balance: { type: 'string', default: '0' },
            no_ripple: { type: 'bool', default: false },
            no_ripple_peer: { type: 'bool', default: false },
            limit: { type: 'string', default: '0' },
            limit_peer: { type: 'string', default: '0' },
            quality_in: { type: 'double', default: 0 },
            quality_out: { type: 'double', default: 0 },
            authorized: { type: 'bool', default: false },
            peer_authorized: { type: 'bool', default: false },
            freeze: { type: 'bool', default: false },
            freeze_peer: { type: 'bool', default: false },
            obligation: { type: 'bool', default: false },
            order: { type: 'int', default: 0 },
            favorite: { type: 'bool', default: false },
            owners: { type: 'linkingObjects', objectType: 'AccountDetails', property: 'lines' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    },

    migration: (oldRealm: Realm, newRealm: Realm) => {
        /*  eslint-disable-next-line */
        console.log('migrating TrustLine schema to 14');

        const oldLines = oldRealm.objects('TrustLine') as any;
        const newLines = newRealm.objects('TrustLine') as any;

        const coreSettings = newRealm.objects('Core') as any;
        const accounts = newRealm.objects('Account') as any;

        if (!coreSettings.isEmpty()) {
            // get connected network from settings
            const { network } = coreSettings[0];

            const removeObjects = [] as any;

            for (let i = 0; i < newLines.length; i++) {
                const oldLine = oldLines.find((l: any) => l.id === newLines[i].id);
                const oldAccount = oldLine.linkingObjects('Account', 'lines')[0];
                if (oldAccount) {
                    const account = accounts.find((a: any) => a.address === oldAccount.address);
                    const accountDetails = account.details.find((d: any) => d.network.id === network.id);

                    // update balance as string
                    newLines[i].balance = String(oldLine.balance);

                    // push to account details
                    accountDetails.lines.push(newLines[i]);
                } else {
                    // this line belongs to no account, just remove it
                    removeObjects.push(newLines[i]);
                }
            }

            // clear up not linked trust lines
            newRealm.delete(removeObjects);
        }
    },
};

export default TrustLineSchema;
