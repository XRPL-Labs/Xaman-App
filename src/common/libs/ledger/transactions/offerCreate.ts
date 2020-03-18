import { get, set, isUndefined } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class OfferCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'OfferCreate';
        }

        this.fields = this.fields.concat(['TakerPays', 'TakerGets', 'OfferSequence', 'Expiration']);
    }

    get TakerPays(): AmountType {
        const pays = get(this, ['tx', 'TakerPays']);

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
        const gets = get(this, ['tx', 'TakerGets']);

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

    set TakerGets(gets: AmountType) {
        if (gets.currency === 'XRP') {
            set(this, 'tx.TakerGets', new Amount(gets.value, false).xrpToDrops());
            return;
        }

        set(this, 'tx.TakerGets', {
            currency: gets.currency,
            value: new Amount(gets.value, false).toString(),
            issuer: gets.issuer,
        });
    }

    set TakerPays(pays: AmountType) {
        if (pays.currency === 'XRP') {
            set(this, 'tx.TakerPays', new Amount(pays.value, false).xrpToDrops());
            return;
        }

        set(this, 'tx.TakerPays', {
            currency: pays.currency,
            value: new Amount(pays.value, false).toString(),
            issuer: pays.issuer,
        });
    }

    get Rate(): number {
        const gets = Number(this.TakerGets.value);
        const pays = Number(this.TakerPays.value);

        let rate = gets / pays;
        rate = this.TakerGets.currency !== 'XRP' ? rate : 1 / rate;

        return new Amount(rate, false).toNumber();
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence']);
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get Executed(): boolean {
        // check for order object
        let foundOrderObject = false;

        // this will ensure that order is executed
        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        affectedNodes.map((node: any) => {
            if (node.ModifiedNode?.LedgerEntryType === 'Offer') {
                foundOrderObject = true;
                return true;
            }
            return false;
        });

        return foundOrderObject;
    }
}

/* Export ==================================================================== */
export default OfferCreate;
