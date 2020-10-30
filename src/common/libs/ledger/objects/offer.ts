import { get, isUndefined } from 'lodash';

import BaseLedgerObject from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Account } from '../parser/types';

/* Class ==================================================================== */
class OfferCreate extends BaseLedgerObject {
    [key: string]: any;

    constructor(object: any) {
        super(object);
    }

    get Account(): Account {
        const source = get(this, ['object', 'Account'], undefined);
        const sourceTag = get(this, ['object', 'SourceTag'], undefined);
        const sourceName = get(this, ['object', 'AccountLabel'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            name: sourceName,
            address: source,
            tag: sourceTag,
        };
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
                currency: 'XRP',
                value: new Amount(pays).dropsToXrp(),
            };
        }

        return {
            currency: pays.currency,
            value: new Amount(pays.value, false).toString(),
            issuer: pays.issuer,
        };
    }

    get TakerGets(): AmountType {
        const gets = get(this, ['object', 'TakerGets']);

        if (isUndefined(gets)) return undefined;

        if (typeof gets === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(gets).dropsToXrp(),
            };
        }

        return {
            currency: gets.currency,
            value: new Amount(gets.value, false).toString(),
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
        rate = this.TakerGets.currency !== 'XRP' ? rate : 1 / rate;

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
export default OfferCreate;
