import Localize from '@locale';

import CronSet from './CronSet.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const CronSetValidation: ValidationType<CronSet> = (tx: CronSet): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tx?.StartTime && !tx?.RepeatCount && !tx?.DelaySeconds && !tx?.Flags) {
            reject(new Error(Localize.t('cronSet.invalidParams')));
            return;
        }

        if (
            (typeof tx?.StartTime !== 'undefined' ||
                typeof tx?.RepeatCount !== 'undefined' ||
                typeof tx?.DelaySeconds !== 'undefined') &&
            tx?.Flags?.tfCronUnset
        ) {
            reject(new Error(Localize.t('cronSet.invalidParamsUnset')));
            return;
        }

        resolve();
    });
};

/* Export ==================================================================== */
export default CronSetValidation;
