/**
 * Base Ledger Object
 */
import { get } from 'lodash';

import Flag from '../parser/common/flag';

/* Types ==================================================================== */
import { LedgerEntriesTypes } from './types';

/* Class ==================================================================== */
class BaseLedgerObject {
    private object: LedgerEntriesTypes;
    [key: string]: any;

    constructor(object?: LedgerEntriesTypes) {
        this.object = object;

        this.ClassName = 'LedgerObject';
    }

    get Type(): string {
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
        const flagParser = new Flag(this.Type, intFlags);
        return flagParser.parse();
    }
}

/* Export ==================================================================== */
export default BaseLedgerObject;
