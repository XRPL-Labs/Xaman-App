import LedgerService from '@services/LedgerService';
import Localize from '@locale';

import AccountDelete from './AccountDelete.class';

/* Types ==================================================================== */
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Validation ==================================================================== */
const AccountDeleteValidation: ValidationType<AccountDelete> = (tx: AccountDelete): Promise<void> => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        // account and destination cannot be same
        if (tx.Account === tx.Destination) {
            reject(new Error(Localize.t('account.destinationAccountAndSourceCannotBeSame')));
            return;
        }

        // check if account have any blocker object
        try {
            const accountObjects = await LedgerService.getAccountBlockerObjects(tx.Account);
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
            const accountSequence = await LedgerService.getAccountSequence(tx.Account);
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
            const resp = await LedgerService.getAccountInfo(tx.Destination);

            if ('error' in resp) {
                reject(new Error(Localize.t('account.destinationAccountIsNotActivated')));
                return;
            }

            const { account_flags } = resp;

            if (account_flags?.requireDestinationTag && tx.DestinationTag === undefined) {
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
