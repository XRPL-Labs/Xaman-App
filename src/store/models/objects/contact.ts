/**
 * Contact Model ( aka Address book )
 */

import Realm from 'realm';

import { ContactSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Contact extends Realm.Object<Contact> {
    public static schema: Realm.ObjectSchema = ContactSchema.schema;

    public id: string;
    public address: string;
    public name: string;
    public destinationTag: string;
    public registerAt?: Date;
    public updatedAt?: Date;
}

export default Contact;
