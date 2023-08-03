/**
 * Base Ledger Object
 */
import { get, has, set, isUndefined } from 'lodash';

import { EncodeCTID } from '@common/utils/codec';

import NetworkService from '@services/NetworkService';

import { Account } from '../parser/types';
import Flag from '../parser/common/flag';

/* Types ==================================================================== */
import { LedgerEntriesTypes } from '../types';

/* Class ==================================================================== */
class BaseLedgerObject {
    protected object: LedgerEntriesTypes;

    constructor(object?: LedgerEntriesTypes) {
        this.object = object;
    }

    get CTID(): string {
        return EncodeCTID(this.Sequence, this.Index, NetworkService.getNetworkId());
    }

    get Account(): Account {
        const source = get(this, ['object', 'Account'], undefined);
        const sourceTag = get(this, ['object', 'SourceTag'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            address: source,
            tag: sourceTag,
        };
    }

    set Account(account: Account) {
        if (has(account, 'address')) {
            set(this, 'object.Account', account.address);
        }
        if (has(account, 'tag')) {
            set(this, 'object.SourceTag', account.tag);
        }
    }

    get LedgerEntryType(): string {
        return get(this, ['object', 'LedgerEntryType'], undefined);
    }

    get Sequence(): number {
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

    get Index(): number {
        return get(this, ['object', 'index'], undefined);
    }

    get Flags(): any {
        const intFlags = get(this, ['object', 'Flags'], undefined);
        const flagParser = new Flag(this.LedgerEntryType, intFlags);
        return flagParser.parse();
    }
}

/* Export ==================================================================== */
export default BaseLedgerObject;
