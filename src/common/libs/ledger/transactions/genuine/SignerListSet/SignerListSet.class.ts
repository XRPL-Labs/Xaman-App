import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { STArray, UInt32 } from '@common/libs/ledger/parser/fields';
import { SignerEntries } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class SignerListSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.SignerListSet as const;
    public readonly Type = SignerListSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        SignerQuorum: { type: UInt32 },
        SignerEntries: { type: STArray, codec: SignerEntries },
    };

    declare SignerQuorum: FieldReturnType<typeof UInt32>;
    declare SignerEntries: FieldReturnType<typeof STArray, typeof SignerEntries>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = SignerListSet.Type;
    }
}

/* Export ==================================================================== */
export default SignerListSet;
