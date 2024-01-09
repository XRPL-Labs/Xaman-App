import { get } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class EnableAmendment extends BaseTransaction {
    public static Type = TransactionTypes.EnableAmendment as const;
    public readonly Type = EnableAmendment.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        this.fields = this.fields.concat(['Amendment']);
    }

    get Amendment(): string {
        const amendment = get(this, ['tx', 'Amendment'], undefined);

        if (typeof amendment === 'undefined') {
            return undefined;
        }

        return amendment;
    }
}

/* Export ==================================================================== */
export default EnableAmendment;
