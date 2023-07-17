import Realm, { Results } from 'realm';
import has from 'lodash/has';

import { ContactModel } from '@store/models';
import BaseRepository from './base';

/* Repository  ==================================================================== */
class ContactRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = ContactModel.schema;
    }

    update = (object: Partial<ContactModel>) => {
        // the primary key should be in the object
        if (!has(object, this.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };

    getContacts = (): Results<ContactModel> => {
        return this.findAll();
    };

    exist = (address: string, tag: string): boolean => {
        return !this.query({ address, destinationTag: tag }).isEmpty();
    };
}

export default new ContactRepository();
