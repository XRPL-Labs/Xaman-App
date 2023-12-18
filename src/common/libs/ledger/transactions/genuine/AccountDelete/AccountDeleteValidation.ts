import { has } from 'lodash';

import LedgerService from '@services/LedgerService';
import Localize from '@locale';

import AccountDelete from './AccountDeleteClass';

/* Validation ==================================================================== */
const AccountDeleteValidation = (tx: AccountDelete): Promise<void> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        // account and destination cannot be same
        if (tx.Account.address === tx.Destination.address) {
            reject(new Error(Localize.t('account.destinationAccountAndSourceCannotBeSame')));
            return;
        }

        // check if account have any blocker object
        try {
            const accountObjects = await LedgerService.getAccountBlockerObjects(tx.Account.address);
            if (Array.isArray(accountObjects) && accountObjects.length > 0) {
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
            const accountSequence = await LedgerService.getAccountSequence(tx.Account.address);
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
            const destinationAccountInfo = await LedgerService.getAccountInfo(tx.Destination.address);

            if (!destinationAccountInfo || has(destinationAccountInfo, 'error')) {
                reject(new Error(Localize.t('account.destinationAccountIsNotActivated')));
                return;
            }

            const { account_flags } = destinationAccountInfo;

            if (account_flags?.requireDestinationTag && tx.Destination.tag === undefined) {
                reject(new Error(Localize.t('account.destinationAddressRequiredDestinationTag')));
                return;
            }
        } catch {
            reject(new Error(Localize.t('account.unableGetDestinationAccountInfo')));
        }

        // everything is fine, resolve
        resolve();
    });
};

/* Export ==================================================================== */
export default AccountDeleteValidation;
