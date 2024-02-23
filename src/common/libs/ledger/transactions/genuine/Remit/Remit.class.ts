import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Hash256, STArray, STObject, UInt32, Blob } from '@common/libs/ledger/parser/fields';
import { Amounts } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Remit extends BaseTransaction {
    public static Type = TransactionTypes.Remit as const;
    public readonly Type = Remit.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amounts: { type: STArray, codec: Amounts },
        URITokenIDs: { type: STArray },
        MintURIToken: { type: STObject },
        Destination: { type: AccountID },
        DestinationTag: { type: UInt32 },
        InvoiceID: { type: Hash256 },
        Blob: { type: Blob },
        Inform: { type: AccountID },
    };

    declare Amounts: FieldReturnType<typeof STArray, typeof Amounts>;
    declare URITokenIDs: FieldReturnType<typeof STArray>;
    declare MintURIToken: FieldReturnType<typeof STObject>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare InvoiceID: FieldReturnType<typeof Hash256>;
    declare Blob: FieldReturnType<typeof Blob>;
    declare Inform: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = Remit.Type;
    }
}

/* Export ==================================================================== */
export default Remit;
