import PermissionedDomainSet from './PermissionedDomainSet.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const PermissionedDomainSetValidation: ValidationType<PermissionedDomainSet> = (): Promise<void> => {
    // TODO: add validation
    return new Promise((resolve) => {
        resolve();
    });
};

/* Export ==================================================================== */
export default PermissionedDomainSetValidation;
