/**
 * Counter Parties Model
 */

import Realm from 'realm';

import { CounterPartySchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class CounterParty extends Realm.Object<CounterParty> {
    public static schema: Realm.ObjectSchema = CounterPartySchema.schema;

    public id: number;
    public name: string;
    public domain: string;
    public avatar: string;
    public shortlist: boolean;
    public registerAt?: Date;
    public updatedAt?: Date;
    public currencies?: any[];
}

export default CounterParty;
