/**
 * TrustLine Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { Truncate } from '@common/utils/string';

import CounterPartyModel from './counterParty';
import CurrencyModel from '@store/models/objects/currency';

import { TrustLineSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class TrustLine extends Realm.Object<TrustLine> {
    public static schema: Realm.ObjectSchema = TrustLineSchema.schema;

    /** Unique identifier representing this specific trust line. `${address}.${currency.id}}` */
    public declare id: string;
    /** Currency model associated with the trust line. */
    public declare currency: CurrencyModel;
    /** The current balance held for this trust line. */
    public declare balance: string;
    /** Indicates if rippling is disabled on this trust line. */
    public declare no_ripple?: boolean;
    /** Reflects if the peer has disabled rippling on this trust line. */
    public declare no_ripple_peer?: boolean;
    /** The maximum amount the user is willing to owe the counterparty. */
    public declare limit?: string;
    /** The maximum amount the counterparty is willing to owe the user. */
    public declare limit_peer?: string;
    /** Quality or rate at which incoming funds are valued on this trust line. */
    public declare quality_in?: number;
    /** Quality or rate at which outgoing funds are valued on this trust line. */
    public declare quality_out?: number;
    /** Indicates if the user has authorized the counterparty to hold their issued currency. */
    public declare authorized?: boolean;
    /** Indicates if the counterparty has authorized the user to hold their issued currency. */
    public declare peer_authorized?: boolean;
    /** Specifies if the user has frozen this trust line, preventing all transfers. */
    public declare freeze?: boolean;
    /** Specifies if the counterparty has frozen this trust line. */
    public declare freeze_peer?: boolean;
    /** Reflects if this trust line represents an obligation or a regular balance. */
    public declare obligation?: boolean;
    /** Order in which the trust line should appear. */
    public declare order?: number;
    /** Indicates if this trust line is marked as a favorite by the user. */
    public declare favorite?: boolean;

    /**
     * Represents the counterparties details associated with this trust line.
     *
     * If the trust line is linked to an existing CounterParty model, it will
     * return the name, avatar, and domain of that counterparty. Otherwise, it
     * will truncate the currency issuer's name and default the avatar and domain.
     *
     * @returns {object} An object containing name, avatar, and domain of the counterparty.
     */
    get counterParty() {
        const counterParties = this.currency.linkingObjects<CounterPartyModel>('CounterParty', 'currencies');
        if (!counterParties.isEmpty()) {
            const { name, avatar, domain } = counterParties[0];
            return { name, avatar, domain };
        }

        return {
            name: Truncate(this.currency.issuer, 11),
            avatar: '',
            domain: '',
        };
    }

    /**
     * Returns true if token is LP Token.
     *
     * @returns {boolean}
     */
    // TODO: improve this by adding an linked object to this line
    isLPToken(): boolean {
        return !!this.currency.currency.startsWith('03');
    }
}

export default TrustLine;
