import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Blob, Amount, Hash256, STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PaymentChannelClaim extends BaseGenuineTransaction {
    public static Type = TransactionTypes.PaymentChannelClaim as const;
    public readonly Type = PaymentChannelClaim.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Channel: { required: true, type: Hash256 },
        Balance: { type: Amount },
        Amount: { type: Amount },
        Signature: { type: Blob },
        PublicKey: { type: Blob },
        CredentialIDs: { type: STArray },
    };

    declare Channel: FieldReturnType<typeof Hash256>;
    declare Balance: FieldReturnType<typeof Amount>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Signature: FieldReturnType<typeof Blob>;
    declare PublicKey: FieldReturnType<typeof Blob>;
    declare CredentialIDs: FieldReturnType<typeof STArray, string[]>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = PaymentChannelClaim.Type;
    }

    get IsChannelClosed(): boolean {
        let closed = false;

        const affectedNodes = this._meta?.AffectedNodes ?? [];

        affectedNodes.map((node) => {
            if ('DeletedNode' in node && node.DeletedNode?.LedgerEntryType === 'PayChannel') {
                closed = true;
                return true;
            }
            return false;
        });

        return closed;
    }
}

/* Export ==================================================================== */
export default PaymentChannelClaim;
