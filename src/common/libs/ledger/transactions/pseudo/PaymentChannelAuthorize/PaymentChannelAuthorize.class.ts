import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Amount, Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PaymentChannelAuthorize extends BaseTransaction {
    public static Type = PseudoTransactionTypes.PaymentChannelAuthorize as const;
    public readonly Type = PaymentChannelAuthorize.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Channel: { required: true, type: Hash256 },
        Amount: { required: true, type: Amount },
    };

    declare Channel: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson) {
        super(tx);
    }
}

/* Export ==================================================================== */
export default PaymentChannelAuthorize;
