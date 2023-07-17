/**
 * Currency Model
 */

import Realm from 'realm';

import { CurrencySchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Currency extends Realm.Object<Currency> {
    public static schema: Realm.ObjectSchema = CurrencySchema.schema;

    public id: string;
    public issuer: string;
    public currency: string;
    public name: string;
    public avatar: string;
    public shortlist: boolean;
}

export default Currency;
