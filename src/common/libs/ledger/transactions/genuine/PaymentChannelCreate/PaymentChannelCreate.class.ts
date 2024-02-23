import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Blob, Amount, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class PaymentChannelCreate extends BaseTransaction {
    public static Type = TransactionTypes.PaymentChannelCreate as const;
    public readonly Type = PaymentChannelCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { required: true, type: Amount },
        Destination: { required: true, type: AccountID },
        DestinationTag: { type: UInt32 },
        SettleDelay: { type: UInt32 },
        PublicKey: { type: Blob },
        CancelAfter: { type: UInt32, codec: RippleTime },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare SettleDelay: FieldReturnType<typeof UInt32>;
    declare PublicKey: FieldReturnType<typeof Blob>;
    declare CancelAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = PaymentChannelCreate.Type;
    }

    get ChannelID(): string {
        let channelID;

        const affectedNodes = this._meta?.AffectedNodes ?? [];

        affectedNodes.map((node) => {
            if ('CreatedNode' in node && node.CreatedNode?.LedgerEntryType === 'PayChannel') {
                channelID = node.CreatedNode?.LedgerIndex;
                return true;
            }
            return false;
        });

        return channelID || 'NOT FOUND';
    }
}

/* Export ==================================================================== */
export default PaymentChannelCreate;
