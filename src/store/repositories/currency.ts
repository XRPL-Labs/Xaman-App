import { has } from 'lodash';
import Realm from 'realm';

import { CurrencyModel, CounterPartyModel } from '@store/models';

import BaseRepository from './base';
import { IssuedCurrency } from '@common/libs/ledger/types/common';

/* Repository  ==================================================================== */
class CurrencyRepository extends BaseRepository<CurrencyModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = CurrencyModel;
    }

    update = (object: CurrencyModel) => {
        // the primary key should be in the object
        if (this.model?.schema?.primaryKey && !has(object, this.model.schema.primaryKey)) {
            throw new Error(`Update require primary key (${this.model.schema.primaryKey}) to be set`);
        }
        return this.create(object, true);
    };

    isVettedCurrency = (issuedCurrency: IssuedCurrency): boolean => {
        const currency = this.findOne({ issuer: issuedCurrency.issuer, currency: issuedCurrency.currency });
        if (!currency) {
            return false;
        }
        return !!currency.name;
    };

    getCounterParty = (currency: CurrencyModel): CounterPartyModel | undefined => {
        const counterParty = currency.linkingObjects<CounterPartyModel>('CounterParty', 'currencies');

        if (!counterParty.isEmpty()) {
            return counterParty[0] as CounterPartyModel;
        }
        return undefined;
    };
}

export default new CurrencyRepository();
