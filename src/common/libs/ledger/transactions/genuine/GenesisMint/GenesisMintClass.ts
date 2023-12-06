import { get } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';
/* Types ==================================================================== */
import { TransactionTypes, TransactionJSONType } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class GenesisMint extends BaseTransaction {
    public static Type = TransactionTypes.GenesisMint as const;
    public readonly Type = GenesisMint.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        this.fields = this.fields.concat(['GenesisMints']);
    }

    get GenesisMints() {
        const genesisMints = get(this, ['tx', 'GenesisMints'], undefined);

        if (!genesisMints || (Array.isArray(genesisMints) && genesisMints.length === 0)) {
            return undefined;
        }

        return genesisMints;
    }

    // eslint-disable-next-line class-methods-use-this
    set GenesisMints(_genesisMints: any) {
        throw new Error('Settings GenesisMints is not allowed!');
    }
}

/* Export ==================================================================== */
export default GenesisMint;
