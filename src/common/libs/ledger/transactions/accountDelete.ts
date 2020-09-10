/**
 * AccountDelete transaction Parser
 */

import { get, isUndefined, has } from 'lodash';

import { AccountSchema } from '@store/schemas/latest';

import LedgerService from '@services/LedgerService';

import Localize from '@locale';

import Amount from '../parser/common/amount';
import { Destination, AmountType } from '../parser/types';

import BaseTransaction from './base';
/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class AccountDelete extends BaseTransaction {
    constructor(tx?: LedgerTransactionType) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'AccountDelete';
        }

        this.fields = this.fields.concat(['Destination', 'DestinationTag']);
    }

    get Amount(): AmountType {
        let amount;

        if (has(this, ['meta', 'DeliveredAmount'])) {
            amount = get(this, ['meta', 'DeliveredAmount']);
        } else {
            amount = get(this, ['meta', 'delivered_amount']);
        }

        // the delivered_amount will be unavailable in old transactions
        // not in this tx type, but better to check
        if (amount === 'unavailable') {
            amount = undefined;
        }

        if (isUndefined(amount)) return undefined;

        return {
            currency: 'XRP',
            value: new Amount(amount).dropsToXrp(),
        };
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

    validate = (account: AccountSchema) => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            if (this.Account.address === this.Destination.address) {
                return reject(new Error(Localize.t('account.destinationAccountAndSourceCannotBeSame')));
            }
            // check if destination is exist
            await LedgerService.getAccountInfo(this.Destination.address)
                /* eslint-disable-next-line */
                .then((accountInfo: any) => {
                    // TODO: handle errors
                    if (!accountInfo || has(accountInfo, 'error')) {
                        return reject(new Error(Localize.t('account.destinationAccountIsNotActivated')));
                    }
                })
                .catch(() => {
                    return reject(new Error(Localize.t('account.unableGetDestinationAccountInfo')));
                });

            // check if there is no account object belong to this account
            if (account.ownerCount > 0) {
                return reject(new Error(Localize.t('account.deleteAccountObjectsExistError')));
            }

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default AccountDelete;
