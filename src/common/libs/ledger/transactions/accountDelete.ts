/**
 * AccountDelete transaction Parser
 */

import { get, isUndefined, has } from 'lodash';

import LedgerService from '@services/LedgerService';

import Locale from '@locale';

import { Destination } from '../parser/types';

import BaseTransaction from './base';
/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class AccountDelete extends BaseTransaction {
    constructor(tx: LedgerTransactionType) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'AccountDelete';
        }

        this.fields = this.fields.concat(['Destination', 'DestinationTag']);
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);
        const destinationName = get(this, ['tx', 'DestinationName'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            name: destinationName,
            address: destination,
            tag: destinationTag,
        };
    }

    validate = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            if (this.Account.address === this.Destination.address) {
                return reject(new Error(Locale.t('account.destinationAccountAndSourceCannotBeSame')));
            }
            // check if destination is exist
            await LedgerService.getAccountInfo(this.Destination.address)
                /* eslint-disable-next-line */
                .then((accountInfo: any) => {
                    // TODO: handle errors
                    if (!accountInfo || has(accountInfo, 'error')) {
                        return reject(new Error(Locale.t('account.destinationAccountIsNotActivated')));
                    }
                })
                .catch(() => {
                    return reject(new Error(Locale.t('account.unableGetRecipientAccountInfoPleaseTryAgain')));
                });

            await LedgerService.getAccountObjects(this.Account.address)
                /* eslint-disable-next-line */
                .then((res: any) => {
                    const { account_objects } = res;
                    if (account_objects.length > 0) {
                        return reject(new Error(Locale.t('account.deleteAccountObjectsExistError')));
                    }
                })
                .catch(() => {
                    return reject(new Error(Locale.t('account.unableToCheckAccountObjects')));
                });

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default AccountDelete;
