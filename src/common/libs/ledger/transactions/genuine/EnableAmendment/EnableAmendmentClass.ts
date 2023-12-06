import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';
import { get } from 'lodash';

/* Class ==================================================================== */
class EnableAmendment extends BaseTransaction {
    public static Type = TransactionTypes.EnableAmendment as const;
    public readonly Type = EnableAmendment.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
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
