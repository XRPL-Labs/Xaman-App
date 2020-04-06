import Realm from 'realm';

// import { BackendService } from '@services';
/**
 * Account Trust Lines Model
 */
// @ts-ignore
class TrustLine extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'TrustLine',
        properties: {
            currency: { type: 'Currency' },
            balance: { type: 'double', default: 0 },
            transfer_rate: { type: 'double', default: 0 },
            no_ripple: 'bool?',
            no_ripple_peer: 'bool?',
            limit: { type: 'double', default: 0 },
            quality_in: { type: 'double', default: 0 },
            quality_out: { type: 'double', default: 0 },
            owners: { type: 'linkingObjects', objectType: 'Account', property: 'lines' },
        },
    };

    public currency: any;
    public balance: number;
    public transfer_rate: number;
    public no_ripple?: boolean;
    public no_ripple_peer?: boolean;
    public limit?: number;
    public limit_peer?: number;
    public quality_in?: number;
    public quality_out?: number;

    constructor(obj: Partial<TrustLine>) {
        super();
        Object.assign(this, obj);
    }

    get counterParty() {
        // return new Promise((resolve, reject) => {
        //     const counterParty = this.currency.linkingObjects('CounterParty', 'currencies');
        //     if (counterParty && counterParty.length > 0) {
        //         resolve(counterParty[0]);
        //         return;
        //     }

        //     BackendService.getAddressInfo(this.currency.issuer).then((issuerInfo: any) => {
        //         let name = `${this.currency.issuer.substr(0, 20)}...`;

        //         if (issuerInfo && issuerInfo.name) {
        //             name = issuerInfo.name;
        //         }

        //         resolve({
        //             name,
        //             avatar: 'https://xumm.app/assets/icons/currencies/trustline-unknown.png',
        //             domain: '',
        //         });
        //     });
        // });

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
            name: `${this.currency.issuer.substr(0, 20)}...`,
            avatar: 'https://xumm.app/assets/icons/currencies/trustline-unknown.png',
            domain: '',
        };
    }
}

export default TrustLine;
