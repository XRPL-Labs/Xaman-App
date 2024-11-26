import Realm from 'realm';
import has from 'lodash/has';

import { ContactModel } from '@store/models';
import BaseRepository from './base';

/* Events  ==================================================================== */
export type ContactRepositoryEvent = {
    contactUpdate: (contact: ContactModel, changes: Partial<ContactModel>) => void;
    contactCreate: (contact: ContactModel) => void;
    contactRemove: (account: Partial<ContactModel>) => void;
};

declare interface ContactRepository {
    on<U extends keyof ContactRepositoryEvent>(event: U, listener: ContactRepositoryEvent[U]): this;
    off<U extends keyof ContactRepositoryEvent>(event: U, listener: ContactRepositoryEvent[U]): this;
    emit<U extends keyof ContactRepositoryEvent>(event: U, ...args: Parameters<ContactRepositoryEvent[U]>): boolean;
}

/* Repository  ==================================================================== */
class ContactRepository extends BaseRepository<ContactModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = ContactModel;
    }

    add = (contact: Partial<ContactModel>) => {
        // the primary key should be in the object
        if (this.model?.schema?.primaryKey && !has(contact, this.model?.schema?.primaryKey)) {
            throw new Error('Add contact require primary key to be set');
        }

        return this.create(contact).then((createdContact: ContactModel) => {
            this.emit('contactCreate', createdContact);
            return createdContact;
        });
    };

    update = async (changes: Partial<ContactModel>) => {
        // the primary key should be in the object
        if (this.model?.schema?.primaryKey && !has(changes, this.model?.schema?.primaryKey)) {
            throw new Error('Update require primary key to be set');
        }
        const updatedObject = await this.create(changes, true);
        this.emit('contactUpdate', updatedObject, changes);
    };

    remove = async (object: ContactModel) => {
        // the primary key should be in the object
        if (this.model?.schema?.primaryKey && !has(object, this.model?.schema?.primaryKey)) {
            throw new Error('Remove require primary key to be set');
        }

        const deletedContact = {
            id: object.id,
            address: object.address,
            tag: object.destinationTag,
        };

        await this.deleteById(object.id);

        this.emit('contactRemove', deletedContact);
    };

    getContacts = () => {
        return this.findAll();
    };

    exist = (address: string, tag: string): boolean => {
        return !this.query({ address, destinationTag: tag }).isEmpty();
    };
}

export default new ContactRepository();
