/**
 * Contact model
 *
 * @class
 * @extends Realm.Object
 */

import Realm from 'realm';

import { ContactSchema } from '@store/models/schemas/latest';

/* Model  ==================================================================== */
class Contact extends Realm.Object<Contact> {
    public static schema: Realm.ObjectSchema = ContactSchema.schema;

    /** Unique identifier of the contact UUID v4. @type {string} */
    public declare id: string;
    /** Address associated with the contact. @type {string} */
    public declare address: string;
    /** Name of the contact. @type {string} */
    public declare name: string;
    /** Destination tag associated with the contact. @type {string} */
    public declare destinationTag: string;
    /** Date when the contact was registered. @type {Date?} */
    public declare registerAt?: Date;
    /** Date when the contact was last updated. @type {Date?} */
    public declare updatedAt?: Date;
}

export default Contact;
