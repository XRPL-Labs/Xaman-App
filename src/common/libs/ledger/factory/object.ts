import { get } from 'lodash';

import * as LedgerObjects from '@common/libs/ledger/objects';

/* Types ==================================================================== */
import { LedgerObjects as LedgerObjectsType } from '@common/libs/ledger/objects/types';
import { LedgerEntry } from '@common/libs/ledger/types/ledger';

/* Module ==================================================================== */
const LedgerObjectFactory = {
    /*
    Parse ledger entry to LedgerObject instance
     */
    fromLedger: (object: LedgerEntry): LedgerObjectsType => {
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

/* Export ==================================================================== */
export default LedgerObjectFactory;
