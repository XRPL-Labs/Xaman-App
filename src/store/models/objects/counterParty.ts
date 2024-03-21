/**
 * Counter Parties Model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { CounterPartySchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class CounterParty extends Realm.Object<CounterParty> {
    public static schema: Realm.ObjectSchema = CounterPartySchema.schema;

    /** Unique identifier for the counterparty. */
    public declare id: number;
    /** Name of the counterparty. */
    public declare name: string;
    /** Domain associated with the counterparty. */
    public declare domain: string;
    /** Avatar image URL or path for the counterparty. */
    public declare avatar: string;
    /** Indicates if the counterparty is on the shortlist. */
    public declare shortlist: boolean;
    /** List of currencies associated with the counterparty. */
    public declare currencies?: any[];
    /** Date when the counterparty was registered. */
    public declare registerAt?: Date;
    /** Date when the counterparty details were last updated. */
    public declare updatedAt?: Date;
}

export default CounterParty;
