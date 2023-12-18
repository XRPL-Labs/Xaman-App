import { isUndefined } from 'lodash';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountModel } from '@store/models/objects';

import Localize from '@locale';

import AccountDelete from './AccountDeleteClass';

/* Descriptor ==================================================================== */
const AccountDeleteInfo = {
    getLabel: (): string => {
        return Localize.t('events.deleteAccount');
    },

    getDescription: (tx: AccountDelete): string => {
        let content = Localize.t('events.itDeletedAccount', { address: tx.Account.address });

        content += '\n\n';
        content += Localize.t('events.itWasInstructedToDeliverTheRemainingBalanceOf', {
            amount: tx.Amount.value,
            currency: NormalizeCurrencyCode(tx.Amount.currency),
            destination: tx.Destination.address,
        });

        if (!isUndefined(tx.Account.tag)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasASourceTag', { tag: tx.Account.tag });
        }
        if (!isUndefined(tx.Destination.tag)) {
            content += '\n';
            content += Localize.t('events.theTransactionHasADestinationTag', { tag: tx.Destination.tag });
        }

        return content;
    },

    getRecipient: (tx: AccountDelete, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return tx.Destination;
    },
};

/* Export ==================================================================== */
export default AccountDeleteInfo;
