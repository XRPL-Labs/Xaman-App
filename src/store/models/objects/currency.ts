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
     * combination of the currency's code and its issuer.
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
    public declare name: string;
    /**
     * URL or local path pointing to an image that visually represents
     */
    public declare avatar: string;
    /**
     * A flag indicating whether this currency is highlighted or preferred in the shortlist
     */
    public declare shortlist: boolean;
    /**
     * An optional xApp identifier linking the currency to a corresponding xApp
     */
    public declare xapp_identifier?: string;
}

export default Currency;
