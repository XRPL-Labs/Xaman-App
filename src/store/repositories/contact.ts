import Realm, { ObjectSchema, Results } from 'realm';
import has from 'lodash/has';

import { ContactSchema } from '@store/schemas/latest';
import BaseRepository from './base';

class ContactRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = ContactSchema.schema;
    }

    update = (object: ContactSchema) => {
        // the primary key should be in the object
        if (!has(object, 'address')) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };

    getContacts = (): Results<ContactSchema> => {
        return this.findAll();
    };
}

export default new ContactRepository();
