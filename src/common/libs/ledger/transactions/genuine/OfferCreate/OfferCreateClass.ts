import { get, isUndefined, set } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';
import Meta from '@common/libs/ledger/parser/meta';

import { EncodeLedgerIndex } from '@common/utils/codec';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { OfferStatus, AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class OfferCreate extends BaseTransaction {
    public static Type = TransactionTypes.OfferCreate as const;
    public readonly Type = OfferCreate.Type;

    private offerStatus: OfferStatus;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = OfferCreate.Type;
        }

        // concat keys
        this.fields = this.fields.concat(['TakerPays', 'TakerGets', 'OfferSequence', 'Expiration', 'OfferID']);

        // memorize offer status
        this.offerStatus = undefined;
    }

    get TakerGets(): AmountType {
        const gets = get(this, ['tx', 'TakerGets']);

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

    set TakerGets(gets: AmountType) {
        if (gets.currency === NetworkService.getNativeAsset()) {
            set(this, 'tx.TakerGets', new Amount(gets.value, false).nativeToDrops());
            return;
        }

        set(this, 'tx.TakerGets', {
            currency: gets.currency,
            value: gets.value,
            issuer: gets.issuer,
        });
    }

    get TakerPays(): AmountType {
        const pays = get(this, ['tx', 'TakerPays']);

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

    set TakerPays(pays: AmountType) {
        if (pays.currency === NetworkService.getNativeAsset()) {
            set(this, 'tx.TakerPays', new Amount(pays.value, false).nativeToDrops());
            return;
        }

        set(this, 'tx.TakerPays', {
            currency: pays.currency,
            value: pays.value,
            issuer: pays.issuer,
        });
    }

    get Rate(): number {
        const gets = Number(this.TakerGets.value);
        const pays = Number(this.TakerPays.value);

        let rate = gets / pays;
        rate = this.TakerGets.currency !== NetworkService.getNativeAsset() ? rate : 1 / rate;

        return new Amount(rate, false).toNumber();
    }

    get OfferID(): string {
        const OfferID = get(this, ['tx', 'OfferID'], undefined);

        if (isUndefined(OfferID)) {
            return undefined;
        }

        return OfferID;
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
