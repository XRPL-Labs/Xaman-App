/**
 * Currency Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { CurrencySchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Currency extends Realm.Object<Currency> {
    public static schema: Realm.ObjectSchema = CurrencySchema.schema;

    /**
     * A unique identifier representing this specific currency instance.
     */
    public declare id: string;
    /**
     * The account of entity or organization responsible for issuing and maintaining the currency.
     */
    public declare issuer: string;
    /**
     * The currency code of the currency (ex: EUR),
     */
    public declare currencyCode: string;
    /**
     * A descriptive, user-friendly name for the currency (ex: Euro) ,
     */
    public declare name?: string;
    /**
     * URL pointing to an image that visually represents the currency issuer
     */
    public declare issuerAvatarUrl?: string;
    /**
     * Human Name for currency issuer
     */
    public declare issuerName?: string;
    /**
     * URL pointing to an image that visually represents the currency
     */
    public declare avatarUrl?: string;
    /**
     * A flag indicating whether this currency is highlighted or preferred in the shortlist
     */
    public declare shortlist: boolean;
    /**
     * An optional xApp identifier linking the currency to a corresponding xApp
     */
    public declare xappIdentifier?: string;
    /**
     * The registration date of the currency
     */
    public declare registerAt: Date;
    /**
     * The last update date of the currency
     */
    public declare updatedAt: Date;
}

export default Currency;
