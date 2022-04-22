/* eslint-disable no-lonely-if */
import { get, isUndefined, set } from 'lodash';

import { EncodeLedgerIndex } from '@common/utils/codec';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';
import Meta from '../parser/meta';

/* Types ==================================================================== */
import { AmountType, OfferStatus } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class OfferCreate extends BaseTransaction {
    public static Type = TransactionTypes.OfferCreate as const;
    public readonly Type = OfferCreate.Type;

    private offerStatus: OfferStatus;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = OfferCreate.Type;
        }

        // concat keys
        this.fields = this.fields.concat(['TakerPays', 'TakerGets', 'OfferSequence', 'Expiration']);

        // memorize offer status
        this.offerStatus = undefined;
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
        const offerSequence = get(this, ['tx', 'OfferSequence'], undefined);

        if (isUndefined(offerSequence)) {
            return get(this, ['tx', 'Sequence'], undefined);
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

    TakerGot(owner?: string): AmountType {
        if (!owner) {
            owner = this.Account.address;
        }

        const balanceChanges = this.BalanceChange(owner);

        if (!balanceChanges?.sent) {
            return {
                ...this.TakerGets,
                value: '0',
            };
        }

        return balanceChanges.sent;
    }

    TakerPaid(owner?: string): AmountType {
        if (!owner) {
            owner = this.Account.address;
        }

        const balanceChanges = this.BalanceChange(owner);

        if (!balanceChanges?.received) {
            return {
                ...this.TakerPays,
                value: '0',
            };
        }

        return balanceChanges.received;
    }

    GetOfferStatus(owner?: string): OfferStatus {
        // if already calculated return the value
        if (this.offerStatus) {
            return this.offerStatus;
        }

        // offer effected by another offer we assume it's partially filled
        if (owner !== this.Account.address) {
            this.offerStatus = OfferStatus.PARTIALLY_FILLED;
            return this.offerStatus;
        }

        const offerLedgerIndex = EncodeLedgerIndex(owner, this.Sequence);

        // unable to calculate offer ledger index
        // NOTE: this should not happen
        if (!offerLedgerIndex) {
            this.offerStatus = OfferStatus.UNKNOWN;
            return this.offerStatus;
        }

        this.offerStatus = new Meta(this.meta).parseOfferStatusChange(owner, offerLedgerIndex);

        return this.offerStatus;
    }
}

/* Export ==================================================================== */
export default OfferCreate;
