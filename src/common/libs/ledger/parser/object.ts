import { get } from 'lodash';

import * as LedgerObjects from '@common/libs/ledger/objects';
import { LedgerEntriesTypes } from '@common/libs/ledger/objects/types';

const ledgerObjectFactory = (object: LedgerEntriesTypes): typeof LedgerObjects => {
    const type = get(object, 'LedgerEntryType');

    const LedgerObject = get(LedgerObjects, type, undefined);

    if (LedgerObject) {
        return new LedgerObject(object);
    }

    return null;
};

export default ledgerObjectFactory;
