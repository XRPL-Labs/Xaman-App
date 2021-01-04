import Realm from 'realm';

/**
 * Counter Parties Currencies Model
 */
class Currency extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Currency',
        primaryKey: 'id',
        properties: {
            id: 'string',
            issuer: 'string',
            currency: 'string',
            name: 'string?',
            avatar: 'string?',
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    };

    public id: string;
    public issuer: string;
    public currency: string;
    public name: string;
    public avatar: string;

    constructor(obj: Partial<Currency>) {
        super();
        Object.assign(this, obj);
    }
}

export default Currency;
