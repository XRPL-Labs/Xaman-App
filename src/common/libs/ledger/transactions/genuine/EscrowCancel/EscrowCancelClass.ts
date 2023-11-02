import { set, get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class EscrowCancel extends BaseTransaction {
    public static Type = TransactionTypes.EscrowCancel as const;
    public readonly Type = EscrowCancel.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = EscrowCancel.Type;
        }

        this.fields = this.fields.concat(['OfferSequence', 'Owner']);
    }

    set Owner(owner: string) {
        set(this, ['tx', 'Owner'], owner);
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner'], undefined);
    }

    set OfferSequence(sequence: number) {
        set(this, ['tx', 'OfferSequence'], sequence);
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence'], undefined);
    }
}

/* Export ==================================================================== */
export default EscrowCancel;
