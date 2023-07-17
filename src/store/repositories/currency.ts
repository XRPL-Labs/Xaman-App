import Realm from 'realm';
import { has } from 'lodash';

import { CurrencyModel, CounterPartyModel } from '@store/models';
import { Issuer } from '@common/libs/ledger/parser/types';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class CurrencyRepository extends BaseRepository {
    initialize(realm: Realm) {
        this.realm = realm;
        this.schema = CurrencyModel.schema;
    }

    include = (data: any): Promise<any> => {
        // assign id if not applied
        if (!has(data, 'id')) {
            throw new Error('Update require primary key (id) to be set');
        }
        return this.upsert(data);
    };

    update = (object: CurrencyModel): void => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key (id) to be set');
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

    getCounterParty = (currency: CurrencyModel): CounterPartyModel => {
        const counterParty = currency.linkingObjects('CounterParty', 'currencies');
        if (!counterParty.isEmpty()) {
            return counterParty[0] as CounterPartyModel;
        }
        return undefined;
    };
}

export default new CurrencyRepository();
