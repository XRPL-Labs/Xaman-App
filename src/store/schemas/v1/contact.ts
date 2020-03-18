import Realm from 'realm';
/**
 * Contact Model ( aka Address book )
 */
// @ts-ignore
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

    constructor(obj: Partial<Contact>) {
        super();
        Object.assign(this, obj);
    }

    // public static migration(oldRealm: any, newRealm: any) {
    //     /*  eslint-disable-next-line */
    //     console.log('migrating Contact model to v2');

    //     const newObjects = newRealm.objects('Contact') as Contact[];

    //     for (let i = 0; i < newObjects.length; i++) {
    //         // set empty destination tag
    //         newObjects[i].destinationTag = '';
    //     }
    // }
}

export default Contact;
