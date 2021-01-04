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
            shortlist: { type: 'bool', default: true },
            owners: { type: 'linkingObjects', objectType: 'CounterParty', property: 'currencies' },
        },
    };

    public id: string;
    public issuer: string;
    public currency: string;
    public name: string;
    public avatar: string;
    public shortlist: boolean;

    constructor(obj: Partial<Currency>) {
        super();
        Object.assign(this, obj);
    }

    public static migration(oldRealm: any, newRealm: any) {
        /*  eslint-disable-next-line */
        console.log('migrating Currency model to v4');

        const newObjects = newRealm.objects('Currency') as Currency[];

        for (let i = 0; i < newObjects.length; i++) {
            newObjects[i].shortlist = true;
        }
    }
}

export default Currency;
