import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Blob, STString, UInt16, UInt8 } from '@common/libs/ledger/parser/fields';
import { TransferFee } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class MPTokenIssuanceCreate extends BaseGenuineTransaction {
    public static Type = TransactionTypes.MPTokenIssuanceCreate as const;
    public readonly Type = MPTokenIssuanceCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        AssetScale: { type: UInt8 },
        TransferFee: { type: UInt16, codec: TransferFee },
        MaximumAmount: { type: STString },
        MPTokenMetadata: { type: Blob },
    };

    declare AssetScale: FieldReturnType<typeof UInt8>;
    declare TransferFee: FieldReturnType<typeof UInt16, typeof TransferFee>;
    declare MaximumAmount: FieldReturnType<typeof STString>;
    declare MPTokenMetadata: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = MPTokenIssuanceCreate.Type;
    }

    get MPTokenIssuanceID(): string | undefined {
        return this._meta?.mpt_issuance_id;
    }
}

/* Export ==================================================================== */
export default MPTokenIssuanceCreate;
