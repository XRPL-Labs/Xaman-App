import NetworkService from '@services/NetworkService';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { EncodeLedgerIndex } from '@common/utils/codec';

import Meta from '@common/libs/ledger/parser/meta';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { UInt32, Amount, Hash256 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { OfferStatus } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class OfferCreate extends BaseGenuineTransaction {
    public static Type = TransactionTypes.OfferCreate as const;
    public readonly Type = OfferCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        TakerPays: { required: true, type: Amount },
        TakerGets: { required: true, type: Amount },
        Expiration: { type: UInt32, codec: RippleTime },
        OfferID: { type: Hash256 },
    };

    declare TakerPays: FieldReturnType<typeof Amount>;
    declare TakerGets: FieldReturnType<typeof Amount>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare OfferID: FieldReturnType<typeof Hash256>;

    private _offerStatus?: OfferStatus;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = OfferCreate.Type;
    }

    get Rate(): number {
        const gets = Number(this.TakerGets!.value);
        const pays = Number(this.TakerPays!.value);

        let rate = gets / pays;
        rate = this.TakerGets!.currency !== NetworkService.getNativeAsset() ? rate : 1 / rate;

        return new AmountParser(rate, false).toNumber();
    }

    get OfferSequence(): number | undefined {
        if (typeof this._tx?.OfferSequence === 'number') {
            return this._tx?.OfferSequence;
        }
        if (typeof this._tx.Sequence === 'number') {
            return this._tx.Sequence;
        }

        return undefined;
    }

    GetOfferStatus(owner?: string): OfferStatus {
        // if already calculated return the value
        // console.log('x1')
        /**
         * This was unnecessary optimisation, no need to cache,
         * we can calc this in time. The biggest problem is that
         * if this is already static, when someone creates an offer (e.g. Exchange flow on an IOU)
         * when during signing someone cancels and then swipes again to sign, it's already flagged
         * as killed (virtual, cancel) and this prevents it from re-computing the outcome,
         * causing the user not to get a trade confirmation after coming back.
         */
        // if (this._offerStatus) {
        //     console.log('x2')
        //     return this._offerStatus;
        // }
        
        // transaction has not been executed
        if (typeof this._meta === 'undefined' || typeof this.Sequence === 'undefined') {
            return OfferStatus.UNKNOWN;
        }
        
        // offer effected by another offer we assume it's partially filledGetOfferStatus
        if (owner !== this.Account) {
            this._offerStatus = OfferStatus.PARTIALLY_FILLED;
            return this._offerStatus;
        }
        
        const offerLedgerIndex = EncodeLedgerIndex(owner, this.Sequence);
        
        // unable to calculate offer ledger index
        // NOTE: this should not happen
        if (!offerLedgerIndex) {
            this._offerStatus = OfferStatus.UNKNOWN;
            return this._offerStatus;
        }
        
        this._offerStatus = new Meta(this._meta).parseOfferStatusChange(owner, offerLedgerIndex);
        
        return this._offerStatus;
    }
}

/* Export ==================================================================== */
export default OfferCreate;
