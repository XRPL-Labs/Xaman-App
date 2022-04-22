/**
 * Base Ledger Object
 */
import { get, has, set, isUndefined } from 'lodash';

import { Account } from '../parser/types';
import Flag from '../parser/common/flag';

/* Types ==================================================================== */
import { LedgerEntriesTypes } from '../types';

/* Class ==================================================================== */
class BaseLedgerObject {
    public readonly ClassName = 'LedgerObject';

    protected object: LedgerEntriesTypes;

    constructor(object?: LedgerEntriesTypes) {
        this.object = object;
    }

    get Account(): Account {
        const source = get(this, ['object', 'Account'], undefined);
        const sourceTag = get(this, ['object', 'SourceTag'], undefined);
        const sourceName = get(this, ['object', 'AccountName'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            name: sourceName,
            address: source,
            tag: sourceTag,
        };
    }

    set Account(account: Account) {
        if (has(account, 'address')) {
            set(this, 'object.Account', account.address);
        }
        if (has(account, 'name')) {
            set(this, 'object.AccountName', account.name);
        }
        if (has(account, 'tag')) {
            set(this, 'object.SourceTag', account.tag);
        }
    }

    get LedgerEntryType(): string {
        return get(this, ['object', 'LedgerEntryType'], undefined);
    }

    get Sequence(): string {
        return get(this, ['object', 'Sequence'], undefined);
    }

    get PreviousTxnID(): string {
        return get(this, ['object', 'PreviousTxnID'], undefined);
    }

    get PreviousTxnLgrSeq(): string {
        return get(this, ['object', 'PreviousTxnLgrSeq'], undefined);
    }

    get OwnerNode(): string {
        return get(this, ['object', 'OwnerNode'], undefined);
    }

    get Index(): string {
        return get(this, ['object', 'index'], undefined);
    }

    get Flags(): any {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        const flagParser = new Flag(this.LedgerEntryType, intFlags);
        return flagParser.parse();
    }
}

/* Export ==================================================================== */
export default BaseLedgerObject;
