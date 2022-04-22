import { get, isUndefined, flatMap } from 'lodash';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';
import { SignerEntry } from '../parser/types';

/* Class ==================================================================== */
class SignerListSet extends BaseTransaction {
    public static Type = TransactionTypes.SignerListSet as const;
    public readonly Type = SignerListSet.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = SignerListSet.Type;
        }

        this.fields = this.fields.concat(['SignerQuorum', 'SignerEntries']);
    }

    get SignerQuorum(): string {
        return get(this, ['tx', 'SignerQuorum']);
    }

    get SignerEntries(): Array<SignerEntry> {
        const entries = get(this, ['tx', 'SignerEntries']);

        return flatMap(entries, (e) => {
            return { account: e.SignerEntry.Account, weight: e.SignerEntry.SignerWeight };
        });
    }
}

/* Export ==================================================================== */
export default SignerListSet;
