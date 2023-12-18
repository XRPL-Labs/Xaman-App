import { AccountModel } from '@store/models';

import Localize from '@locale';

import AccountSet from './AccountSetClass';

/* Descriptor ==================================================================== */
const AccountSetInfo = {
    getLabel: (tx: AccountSet): string => {
        if (tx.isNoOperation() && tx.isCancelTicket()) {
            return Localize.t('events.cancelTicket');
        }
        return Localize.t('events.accountSettings');
    },

    getDescription: (tx: AccountSet): string => {
        let content = Localize.t('events.thisIsAnAccountSetTransaction');

        if (tx.isNoOperation()) {
            content += '\n';
            if (tx.isCancelTicket()) {
                content += Localize.t('events.thisTransactionClearTicket', { ticketSequence: tx.TicketSequence });
            } else {
                content += Localize.t('events.thisTransactionDoesNotEffectAnyAccountSettings');
            }
            return content;
        }

        if (tx.Domain !== undefined) {
            content += '\n';
            if (tx.Domain === '') {
                content += Localize.t('events.itRemovesTheAccountDomain');
            } else {
                content += Localize.t('events.itSetsAccountDomainTo', { domain: tx.Domain });
            }
        }

        if (tx.EmailHash !== undefined) {
            content += '\n';
            if (tx.EmailHash === '') {
                content += Localize.t('events.itRemovesTheAccountEmailHash');
            } else {
                content += Localize.t('events.itSetsAccountEmailHashTo', { emailHash: tx.EmailHash });
            }
        }

        if (tx.MessageKey !== undefined) {
            content += '\n';
            if (tx.MessageKey === '') {
                content += Localize.t('events.itRemovesTheAccountMessageKey');
            } else {
                content += Localize.t('events.itSetsAccountMessageKeyTo', { messageKey: tx.MessageKey });
            }
        }

        if (tx.TransferRate !== undefined) {
            content += '\n';
            if (tx.TransferRate === 0) {
                content += Localize.t('events.itRemovesTheAccountTransferRate');
            } else {
                content += Localize.t('events.itSetsAccountTransferRateTo', { transferRate: tx.TransferRate });
            }
        }

        if (tx.NFTokenMinter !== undefined) {
            content += '\n';
            if (tx.NFTokenMinter === '') {
                content += Localize.t('events.itRemovesTheAccountMinter');
            } else {
                content += Localize.t('events.itSetsAccountMinterTo', { minter: tx.NFTokenMinter });
            }
        }

        if (tx.SetFlag !== undefined) {
            content += '\n';
            content += Localize.t('events.itSetsTheAccountFlag', { flag: tx.SetFlag });
        }

        if (tx.ClearFlag !== undefined) {
            content += '\n';
            content += Localize.t('events.itClearsTheAccountFlag', { flag: tx.ClearFlag });
        }

        if (tx.WalletLocator !== undefined) {
            content += '\n';
            if (tx.WalletLocator === '') {
                content += Localize.t('events.itRemovesTheAccountWalletLocator');
            } else {
                content += Localize.t('events.itSetsAccountWalletLocatorTo', { walletLocator: tx.WalletLocator });
            }
        }

        if (tx.WalletSize !== undefined) {
            content += '\n';
            if (tx.WalletSize === 0) {
                content += Localize.t('events.itRemovesTheAccountWalletSize');
            } else {
                content += Localize.t('events.itSetsAccountWalletSizeTo', { walletSize: tx.WalletSize });
            }
        }

        return content;
    },

    getRecipient: (tx: AccountSet, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }

        return undefined;
    },
};

/* Export ==================================================================== */
export default AccountSetInfo;
