import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Amount, Hash256, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PaymentChannelFund extends BaseGenuineTransaction {
    public static Type = TransactionTypes.PaymentChannelFund as const;
    public readonly Type = PaymentChannelFund.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Channel: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
        Expiration: { type: UInt32, codec: RippleTime },
    };

    declare Channel: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = PaymentChannelFund.Type;
    }
}

/* Export ==================================================================== */
export default PaymentChannelFund;
