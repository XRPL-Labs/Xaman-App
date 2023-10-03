import { has } from 'lodash';
import Realm from 'realm';

import { CurrencyModel, CounterPartyModel } from '@store/models';
import { Issuer } from '@common/libs/ledger/parser/types';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class CurrencyRepository extends BaseRepository<CurrencyModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = CurrencyModel;
    }

    include = (data: any): Promise<any> => {
        // assign id if not applied
        if (!has(data, 'id')) {
            throw new Error('Update require primary key (id) to be set');
        }
        return this.upsert(data);
    };

    update = (object: CurrencyModel) => {
        // the primary key should be in the object
        if (!has(object, 'id')) {
            throw new Error('Update require primary key (id) to be set');
        }
        return this.create(object, true);
    };

    isVettedCurrency = (issuer: Issuer): boolean => {
        const currency = this.findOne({ issuer: issuer.issuer, currency: issuer.currency });
        if (!currency) {
            return false;
        }
        return !!currency.name;
    };

    getCounterParty = (currency: CurrencyModel): CounterPartyModel => {
        const counterParty = currency.linkingObjects<CounterPartyModel>('CounterParty', 'currencies');

        if (!counterParty.isEmpty()) {
            return counterParty[0] as CounterPartyModel;
        }
        return undefined;
    };
}

export default new CurrencyRepository();
