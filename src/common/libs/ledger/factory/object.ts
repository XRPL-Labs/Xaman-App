import { get } from 'lodash';

import * as LedgerObjects from '@common/libs/ledger/objects';
import { LedgerEntriesTypes } from '@common/libs/ledger/objects/types';

const LedgerObjectFactory = {
    fromLedger: (object: LedgerEntriesTypes): typeof LedgerObjects => {
        // get ledger entry type
        const type = get(object, 'LedgerEntryType');

        // get the class object base on the object type
        const LedgerObject = get(LedgerObjects, type, undefined);

        if (LedgerObject) {
            return new LedgerObject(object);
        }

        return null;
    },
};

export default LedgerObjectFactory;
