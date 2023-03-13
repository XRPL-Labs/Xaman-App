import Realm from 'realm';
/**
 * Contact Model ( aka Address book )
 */
class Contact extends Realm.Object {
    public static schema: Realm.ObjectSchema = {
        name: 'Contact',
        primaryKey: 'id',
        properties: {
            id: { type: 'string' },
            address: { type: 'string', indexed: true },
            name: { type: 'string' },
            destinationTag: { type: 'string' },
            registerAt: { type: 'date', default: new Date() },
            updatedAt: { type: 'date', default: new Date() },
        },
    };

    public id: string;
    public address: string;
    public name: string;
    public destinationTag: string;
    public registerAt?: Date;
    public updatedAt?: Date;
}

export default Contact;
