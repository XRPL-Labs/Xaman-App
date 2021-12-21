/**
 * AccountDelete transaction Parser
 */

import { get, isUndefined, has } from 'lodash';

import { AccountSchema } from '@store/schemas/latest';

import LedgerService from '@services/LedgerService';

import Localize from '@locale';

import Amount from '../parser/common/amount';
import Flag from '../parser/common/flag';
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

        // as this only will be XRP we only check for string & number
        if (typeof amount === 'string' || typeof amount === 'number') {
            return {
                currency: 'XRP',
                value: new Amount(amount).dropsToXrp(),
            };
        }

        return undefined;
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
        return new Promise<void>(async (resolve, reject) => {
            if (this.Account.address === this.Destination.address) {
                return reject(new Error(Localize.t('account.destinationAccountAndSourceCannotBeSame')));
            }

            // check if account have any blocker object
            await LedgerService.getAccountBlockerObjects(this.Account.address)
                .then((accountObjects) => {
                    if (!Array.isArray(accountObjects) || accountObjects.length > 0) {
                        return reject(new Error(Localize.t('account.deleteAccountObjectsExistError')));
                    }
                    return true;
                })
                .catch(() => {
                    return reject(new Error(Localize.t('account.unableToCheckAccountObjects')));
                });

            // check if account sequence is met the account delete condition
            const { LastLedger } = LedgerService.getLedgerStatus();

            if (LastLedger === 0) {
                return reject(new Error(Localize.t('account.unableToFetchLedgerSequence')));
            }

            const remainingSequence = Number(account.sequence) + 256 - LastLedger;
            if (remainingSequence > 0) {
                return reject(
                    new Error(
                        Localize.t('account.deleteAccountSequenceIsNotEnoughError', {
                            remainingSequence,
                        }),
                    ),
                );
            }

            // check if destination is exist or required destination tag flag is set
            await LedgerService.getAccountInfo(this.Destination.address)
                /* eslint-disable-next-line */
                .then((accountInfo: any) => {
                    if (!accountInfo || has(accountInfo, 'error')) {
                        return reject(new Error(Localize.t('account.destinationAccountIsNotActivated')));
                    }

                    const { account_data } = accountInfo;

                    if (has(account_data, ['Flags'])) {
                        const accountFlags = new Flag('Account', account_data.Flags).parse();

                        if (accountFlags.requireDestinationTag && this.Destination.tag === undefined) {
                            return reject(new Error(Localize.t('account.destinationAddressRequiredDestinationTag')));
                        }
                    }
                })
                .catch(() => {
                    return reject(new Error(Localize.t('account.unableGetDestinationAccountInfo')));
                });

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default AccountDelete;
