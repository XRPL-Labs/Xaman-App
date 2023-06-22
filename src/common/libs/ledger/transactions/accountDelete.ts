/**
 * AccountDelete transaction Parser
 */

import { get, isUndefined, has } from 'lodash';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

import Localize from '@locale';

import Amount from '../parser/common/amount';
import Flag from '../parser/common/flag';
import { Destination, AmountType } from '../parser/types';

import BaseTransaction from './base';
/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class AccountDelete extends BaseTransaction {
    public static Type = TransactionTypes.AccountDelete as const;
    public readonly Type = AccountDelete.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AccountDelete.Type;
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

        // as this only will be native currency we only check for string & number
        if (typeof amount === 'string' || typeof amount === 'number') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return undefined;
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }

    validate = (): Promise<void> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            // account and destination cannot be same
            if (this.Account.address === this.Destination.address) {
                reject(new Error(Localize.t('account.destinationAccountAndSourceCannotBeSame')));
                return;
            }

            // check if account have any blocker object
            try {
                const accountObjects = await LedgerService.getAccountBlockerObjects(this.Account.address);
                if (!Array.isArray(accountObjects) || accountObjects.length > 0) {
                    reject(new Error(Localize.t('account.deleteAccountObjectsExistError')));
                    return;
                }
            } catch {
                reject(new Error(Localize.t('account.unableToCheckAccountObjects')));
                return;
            }

            // check if account sequence is met the account delete condition
            const { LastLedger } = LedgerService.getLedgerStatus();
            if (LastLedger === 0) {
                reject(new Error(Localize.t('account.unableToFetchLedgerSequence')));
                return;
            }

            // check if account have any blocker object
            try {
                const accountSequence = await LedgerService.getAccountSequence(this.Account.address);
                const remainingSequence = accountSequence + 256 - LastLedger;

                if (remainingSequence > 0) {
                    reject(
                        new Error(
                            Localize.t('account.deleteAccountSequenceIsNotEnoughError', {
                                remainingSequence,
                            }),
                        ),
                    );
                    return;
                }
            } catch {
                reject(new Error(Localize.t('account.unableGetAccountInfo')));
                return;
            }

            // check if destination exist or required destination tag flag is set
            try {
                const destinationAccountInfo = await LedgerService.getAccountInfo(this.Destination.address);

                if (!destinationAccountInfo || has(destinationAccountInfo, 'error')) {
                    reject(new Error(Localize.t('account.destinationAccountIsNotActivated')));
                    return;
                }

                const { account_data } = destinationAccountInfo;

                if (has(account_data, ['Flags'])) {
                    const accountFlags = new Flag('Account', account_data.Flags).parse();
                    if (accountFlags.requireDestinationTag && this.Destination.tag === undefined) {
                        reject(new Error(Localize.t('account.destinationAddressRequiredDestinationTag')));
                        return;
                    }
                }
            } catch {
                reject(new Error(Localize.t('account.unableGetDestinationAccountInfo')));
            }

            // everything is fine, resolve
            resolve();
        });
    };
}

/* Export ==================================================================== */
export default AccountDelete;
