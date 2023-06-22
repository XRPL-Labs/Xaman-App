import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import BaseLedgerObject from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { LedgerObjectTypes } from '../types';

/* Class ==================================================================== */
class Offer extends BaseLedgerObject {
    public static Type = LedgerObjectTypes.Offer as const;
    public readonly Type = Offer.Type;

    constructor(object: any) {
        super(object);
    }

    get BookDirectory(): string {
        return get(this, ['object', 'BookDirectory']);
    }

    get BookNode(): string {
        return get(this, ['object', 'BookNode']);
    }

    get TakerPays(): AmountType {
        const pays = get(this, ['object', 'TakerPays']);

        if (isUndefined(pays)) return undefined;

        if (typeof pays === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(pays).dropsToNative(),
            };
        }

        return {
            currency: pays.currency,
            value: pays.value,
            issuer: pays.issuer,
        };
    }

    get TakerGets(): AmountType {
        const gets = get(this, ['object', 'TakerGets']);

        if (isUndefined(gets)) return undefined;

        if (typeof gets === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(gets).dropsToNative(),
            };
        }

        return {
            currency: gets.currency,
            value: gets.value,
            issuer: gets.issuer,
        };
    }

    get Date(): any {
        return this.Expiration;
    }

    get Rate(): number {
        const gets = Number(this.TakerGets.value);
        const pays = Number(this.TakerPays.value);

        let rate = gets / pays;
        rate = this.TakerGets.currency !== NetworkService.getNativeAsset() ? rate : 1 / rate;

        return new Amount(rate, false).toNumber();
    }

    get OfferSequence(): number {
        const offerSequence = get(this, ['object', 'OfferSequence']);

        if (isUndefined(offerSequence)) {
            return get(this, ['object', 'Sequence']);
        }

        return offerSequence;
    }

    get Expiration(): string {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }
}

/* Export ==================================================================== */
export default Offer;
