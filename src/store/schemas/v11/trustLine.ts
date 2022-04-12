import Realm from 'realm';

import { Truncate } from '@common/utils/string';
import { XRPLValueToNFT } from '@common/utils/amount';
import { Images } from '@common/helpers/images';

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
            order: { type: 'int', default: 0 },
            favorite: { type: 'bool', default: false },
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
    public order?: number;
    public favorite?: boolean;

    constructor(obj: Partial<TrustLine>) {
        super();
        Object.assign(this, obj);
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
            avatar: this.isNFT ? Images.ImageUnknownNFT.uri : Images.ImageUnknownTrustLine.uri,
            domain: '',
        };
    }

    get isNFT(): boolean {
        return !!XRPLValueToNFT(this.balance);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating TrustLine model to v11');

        const newObjects = newRealm.objects('TrustLine') as TrustLine[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].order = i;
            newObjects[i].favorite = false;
        }
    }
}

export default TrustLine;
