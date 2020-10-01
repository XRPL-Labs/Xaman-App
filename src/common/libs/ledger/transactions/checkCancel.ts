import moment from 'moment-timezone';

import { set, get, isUndefined } from 'lodash';

import Localize from '@locale';

import BaseTransaction from './base';
import CheckCreate from './checkCreate';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class CheckCancel extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'CheckCancel';
        }

        this.fields = this.fields.concat(['CheckID']);
    }

    get CheckID(): string {
        return get(this, 'tx.CheckID', undefined);
    }

    set Check(check: CheckCreate) {
        set(this, 'check', check);
    }

    get Check(): CheckCreate {
        return get(this, 'check', undefined);
    }

    get isExpired(): boolean {
        const date = get(this, ['Check', 'Expiration'], undefined);
        if (isUndefined(date)) return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }

    validate = () => {
        /* eslint-disable-next-line */
        return new Promise((resolve, reject) => {
            if (!this.Check) {
                return reject(new Error(Localize.t('payload.unableToGetCheckObject')));
            }

            // The source or the destination of the check can cancel a Check at any time using this transaction type.
            // If the Check has expired, any address can cancel it.
            if (!this.isExpired) {
                if (
                    this.Account.address !== this.Check.Destination.address ||
                    this.Account.address !== this.Check.Account.address
                ) {
                    return reject(new Error(Localize.t('payload.nonExpiredCheckCanOnlyCancelByCreatedAccount')));
                }
            }

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default CheckCancel;
