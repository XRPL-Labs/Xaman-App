import Realm from 'realm';
import has from 'lodash/has';

import { ContactModel } from '@store/models';
import BaseRepository from './base';

/* Repository  ==================================================================== */
class ContactRepository extends BaseRepository<ContactModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = ContactModel;
    }

    update = (object: Partial<ContactModel>) => {
        // the primary key should be in the object
        if (!has(object, this.model.schema.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }
        return this.create(object, true);
    };

    getContacts = () => {
        return this.findAll();
    };

    exist = (address: string, tag: string): boolean => {
        return !this.query({ address, destinationTag: tag }).isEmpty();
    };
}

export default new ContactRepository();
