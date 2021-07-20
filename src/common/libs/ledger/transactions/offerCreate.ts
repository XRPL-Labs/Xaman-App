/* eslint-disable no-lonely-if */
import BigNumber from 'bignumber.js';
import { get, set, find, isUndefined } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';
import Meta from '../parser/meta';

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
        const offerSequence = get(this, ['tx', 'OfferSequence']);

        if (isUndefined(offerSequence)) {
            return get(this, ['tx', 'Sequence']);
        }

        return offerSequence;
    }

    get Expiration(): string {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    set Expiration(date: string) {
        const ledgerDate = new LedgerDate(date);
        set(this, 'tx.Expiration', ledgerDate.toLedgerTime());
    }

    get Executed(): boolean {
        // check for order object
        let foundOrderObject = false;

        // this will ensure that order is executed
        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        // partially filled || filled
        affectedNodes.map((node: any) => {
            if (node.ModifiedNode?.LedgerEntryType === 'Offer' || node.DeletedNode?.LedgerEntryType === 'Offer') {
                foundOrderObject = true;
                return true;
            }
            return false;
        });

        return foundOrderObject;
    }

    TakerGot(owner?: string): AmountType {
        if (!owner) {
            owner = this.Account.address;
        }

        const balanceChanges = get(new Meta(this.meta).parseBalanceChanges(), owner);

        // @ts-ignore
        const takerGot = find(balanceChanges, (o) => o.action === 'DEC');

        if (!takerGot) {
            return {
                ...this.TakerGets,
                value: '0',
            };
        }

        //  remove fee from end result if xrp
        if (takerGot.currency === 'XRP' && owner === this.Account.address) {
            set(takerGot, 'value', new BigNumber(takerGot.value).minus(this.Fee).decimalPlaces(8).toString(10));
        }

        return takerGot;
    }

    TakerPaid(owner?: string): AmountType {
        if (!owner) {
            owner = this.Account.address;
        }

        const balanceChanges = get(new Meta(this.meta).parseBalanceChanges(), owner);

        const takerPaid = find(balanceChanges, (o) => o.action === 'INC');

        if (!takerPaid) {
            return {
                ...this.TakerPays,
                value: '0',
            };
        }

        //  remove fee from end result if xrp and own offer tx
        if (takerPaid.currency === 'XRP' && owner === this.Account.address) {
            set(takerPaid, 'value', new BigNumber(takerPaid.value).minus(this.Fee).decimalPlaces(8).toString(10));
        }

        return takerPaid;
    }
}

/* Export ==================================================================== */
export default OfferCreate;
