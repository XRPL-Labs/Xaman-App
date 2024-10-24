/**
 * OracleSet transaction
 */

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Blob, STArray, UInt32 } from '@common/libs/ledger/parser/fields';
import { Hex, PriceDataSeries } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class OracleSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.OracleSet as const;
    public readonly Type = OracleSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        OracleDocumentID: { type: UInt32 },
        Provider: { type: Blob, codec: Hex },
        URI: { type: Blob },
        LastUpdateTime: { type: UInt32 },
        AssetClass: { type: Blob, codec: Hex },
        PriceDataSeries: { type: STArray, codec: PriceDataSeries },
    };

    declare OracleDocumentID: FieldReturnType<typeof UInt32>;
    declare Provider: FieldReturnType<typeof Blob, typeof Hex>;
    declare URI: FieldReturnType<typeof Blob>;
    declare LastUpdateTime: FieldReturnType<typeof UInt32>;
    declare AssetClass: FieldReturnType<typeof Blob, typeof Hex>;
    declare PriceDataSeries: FieldReturnType<typeof STArray, typeof PriceDataSeries>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = OracleSet.Type;
    }
}

/* Export ==================================================================== */
export default OracleSet;
