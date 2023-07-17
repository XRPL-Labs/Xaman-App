/**
 * Account Trust Line Model
 */

import Realm from 'realm';

import { Truncate } from '@common/utils/string';
import { TrustLineSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class TrustLine extends Realm.Object<TrustLine> {
    public static schema: Realm.ObjectSchema = TrustLineSchema.schema;

    public id: string;
    public currency: any;
    public balance: string;
    public no_ripple?: boolean;
    public no_ripple_peer?: boolean;
    public limit?: string;
    public limit_peer?: string;
    public quality_in?: number;
    public quality_out?: number;
    public authorized?: boolean;
    public peer_authorized?: boolean;
    public freeze?: boolean;
    public freeze_peer?: boolean;
    public obligation?: boolean;
    public order?: number;
    public favorite?: boolean;

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
