import * as LedgerObjects from '@common/libs/ledger/objects';

/* Types ==================================================================== */

import { LedgerObjects as LedgerObjectsType } from '@common/libs/ledger/objects/types';
import { LedgerEntry } from '@common/libs/ledger/types/ledger';

/* Module ==================================================================== */
const LedgerObjectFactory = {
    /*
    Parse ledger entry to LedgerObject instance
     */
    fromLedger: (object: LedgerEntry): LedgerObjectsType | undefined => {
        // get ledger entry type
        const type = object?.LedgerEntryType;

        if (!(type in LedgerObjects)) {
            return undefined;
        }

        // get the class object base on the object type
        // @ts-expect-error
        const LedgerObject = LedgerObjects[type];

        if (typeof LedgerObject !== 'undefined') {
            return new LedgerObject(object);
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default LedgerObjectFactory;
