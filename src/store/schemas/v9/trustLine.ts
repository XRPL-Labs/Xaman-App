import Realm from 'realm';

import { Truncate } from '@common/utils/string';

/**
 * Account Trust Lines Model
 */
class TrustLine extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'TrustLine',
        primaryKey: 'id',
        properties: {
            id: 'string',
            currency: { type: 'Currency' },
            balance: { type: 'double', default: 0 },
            transfer_rate: { type: 'double', default: 0 },
            no_ripple: { type: 'bool', default: false },
            no_ripple_peer: { type: 'bool', default: false },
            limit: { type: 'double', default: 0 },
            limit_peer: { type: 'double', default: 0 },
            quality_in: { type: 'double', default: 0 },
            quality_out: { type: 'double', default: 0 },
            authorized: { type: 'bool', default: false },
            peer_authorized: { type: 'bool', default: false },
            freeze: { type: 'bool', default: false },
            freeze_peer: { type: 'bool', default: false },
            obligation: { type: 'bool', default: false },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'lines' },
        },
    };

    public id: string;
    public currency: any;
    public balance: number;
    /**
     * @deprecated this field should not be used
     */
    public transfer_rate: number;
    public no_ripple?: boolean;
    public no_ripple_peer?: boolean;
    public limit?: number;
    public limit_peer?: number;
    public quality_in?: number;
    public quality_out?: number;
    public authorized?: boolean;
    public peer_authorized?: boolean;
    public freeze?: boolean;
    public freeze_peer?: boolean;
    public obligation?: boolean;

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating TrustLine model to v9');

        // change currency id
        const newCurrencies = newRealm.objects('Currency') as any;
        for (let i = 0; i < newCurrencies.length; i++) {
            newCurrencies[i].id = `${newCurrencies[i].issuer}.${newCurrencies[i].currency}`;
        }

        const newObjects = newRealm.objects('TrustLine') as TrustLine[];

        const removeObjects = [] as any;

        for (let i = 0; i < newObjects.length; i++) {
            if (newObjects[i].linkingObjectsCount() > 0) {
                const account = newObjects[i].linkingObjects('Account', 'lines')[0] as any;
                newObjects[i].id = `${account.address}.${newObjects[i].currency.id}`;
            } else {
                removeObjects.push(newObjects[i]);
            }
        }

        // clear up not linked trust lines
        newRealm.delete(removeObjects);
    }

    get counterParty() {
        const counterParty = this.currency.linkingObjects('CounterParty', 'currencies');
        if (!counterParty.isEmpty()) {
            const item = counterParty[0];
            return {
                name: item.name,
                avatar: item.avatar,
                domain: item.domain,
            };
        }

        return {
            name: Truncate(this.currency.issuer, 11),
            avatar: '',
            domain: '',
        };
    }
}

export default TrustLine;
