import Realm, { ObjectSchema } from 'realm';
import { assign, has } from 'lodash';

import { CurrencySchema } from '@store/schemas/latest';
import { Issuer } from '@common/libs/ledger/parser/types';

import BaseRepository from './base';

class CurrencyRepository extends BaseRepository {
    realm: Realm;
    schema: ObjectSchema;

    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CurrencySchema.schema;
    }

    include = (data: any): Promise<any> => {
        // assign id if not applied
        if (!has(data, 'id')) {
            assign(data, { id: `${data.issuer}.${data.currency}` });
        }
        return this.upsert(data);
    };

    update = (object: CurrencySchema): void => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key to be set');
        }
        this.create(object, true);
    };

    isVettedCurrency = (issuer: Issuer): boolean => {
        const currency = this.findOne({ issuer: issuer.issuer, currency: issuer.currency });
        if (!currency) {
            return false;
        }
        return !!currency.name;
    };
}

export default new CurrencyRepository();
