import PermissionedDomain from './PermissionedDomain.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const PermissionedDomainValidation: ValidationType<PermissionedDomain> = (
    object: PermissionedDomain,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        reject(new Error(`Object type ${object.Type} does not contain validation!`));
    });
};

/* Export ==================================================================== */
export default PermissionedDomainValidation;
