import Realm from 'realm';
import CurrencySchema from './currency';

/**
 * Counter Parties Model
 */
// @ts-ignore
class CounterParty extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'CounterParty',
        primaryKey: 'id',
        properties: {
            id: { type: 'int' },
            name: { type: 'string', indexed: true },
            avatar: 'string',
            domain: 'string',
            currencies: { type: 'list', objectType: 'Currency' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public id: number;
    public name: string;
    public domain: string;
    public avatar: string;
    public registerAt?: Date;
    public updatedAt?: Date;
    public currencies?: CurrencySchema[];

    constructor(obj: Partial<CounterParty>) {
        super();
        Object.assign(this, obj);
    }
}

export default CounterParty;
