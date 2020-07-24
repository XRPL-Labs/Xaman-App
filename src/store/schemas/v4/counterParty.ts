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
            shortlist: { type: 'bool', default: true },
            currencies: { type: 'list', objectType: 'Currency' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public id: number;
    public name: string;
    public domain: string;
    public avatar: string;
    public shortlist: boolean;
    public registerAt?: Date;
    public updatedAt?: Date;
    public currencies?: CurrencySchema[];
    public isValid?: () => boolean;

    constructor(obj: Partial<CounterParty>) {
        super();
        Object.assign(this, obj);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating CounterParty model to v4');

        const newObjects = newRealm.objects('CounterParty') as CounterParty[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].shortlist = true;
        }
    }
}

export default CounterParty;
