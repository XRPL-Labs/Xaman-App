/**
 * TrustLine Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import CurrencyModel from '@store/models/objects/currency';

import { TrustLineSchema } from '@store/models/schemas/latest';

import { Truncate } from '@common/utils/string';

import Localize from '@locale';

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
     * Returns true if token is LP Token.
     *
     * @returns {boolean}
     */
    isLiquidityPoolToken(): boolean {
        // TODO: improve this check for LP token
        return this.currency.currencyCode.startsWith('03');
    }

    getFormattedCurrency(): string {
        // if there is a name for currency return the name

        if (this.currency.name) {
            return `${this.currency.name}`;
        }

        // LP token
        if (this.isLiquidityPoolToken()) {
            const assetPair = this.linkingObjects<{ pairs: Array<string | CurrencyModel> }>('AmmPair', 'line');

            // return pairs currency code
            if (!assetPair.isEmpty()) {
                return assetPair[0]?.pairs
                    .map((pair) => (typeof pair === 'string' ? pair : NormalizeCurrencyCode(pair.currencyCode)))
                    .join(' / ');
            }
        }

        // normalized currency code
        return NormalizeCurrencyCode(this.currency.currencyCode);
    }

    getFormattedIssuer(owner?: string): string {
        // self issued
        if (owner && this.currency.issuer === owner) {
            return Localize.t('home.selfIssued');
        }

        // issuer name + currency code
        if (this.currency.issuerName) {
            return `${this.currency.issuerName} ${NormalizeCurrencyCode(this.currency.currencyCode)}`;
        }

        // issuer address
        return Truncate(this.currency.issuer, 11);
    }
}

export default TrustLine;
