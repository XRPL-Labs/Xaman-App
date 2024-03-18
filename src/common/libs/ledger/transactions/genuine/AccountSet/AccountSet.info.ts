import Localize from '@locale';

import { AccountModel } from '@store/models';

import AccountSet from './AccountSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class AccountSetInfo extends ExplainerAbstract<AccountSet, MutationsMixinType> {
    constructor(item: AccountSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (this.item.isNoOperation() && this.item.isCancelTicket()) {
            return Localize.t('events.cancelTicket');
        }
        return Localize.t('events.updateAccountSettings');
    }

    generateDescription(): string {
        const content = [Localize.t('events.thisIsAnAccountSetTransaction')];

        // No-OP
        if (this.item.isNoOperation()) {
            content.push(
                this.item.isCancelTicket()
                    ? Localize.t('events.thisTransactionClearTicket', { ticketSequence: this.item.TicketSequence })
                    : Localize.t('events.thisTransactionDoesNotEffectAnyAccountSettings'),
            );
            return content.join('\n');
        }

        if (typeof this.item.Domain !== 'undefined') {
            if (this.item.Domain === '') {
                content.push(Localize.t('events.itRemovesTheAccountDomain'));
            } else {
                content.push(Localize.t('events.itSetsAccountDomainTo', { domain: this.item.Domain }));
            }
        }

        if (typeof this.item.EmailHash !== 'undefined') {
            if (this.item.EmailHash === '') {
                content.push(Localize.t('events.itRemovesTheAccountEmailHash'));
            } else {
                content.push(Localize.t('events.itSetsAccountEmailHashTo', { emailHash: this.item.EmailHash }));
            }
        }

        if (typeof this.item.MessageKey !== 'undefined') {
            if (this.item.MessageKey === '') {
                content.push(Localize.t('events.itRemovesTheAccountMessageKey'));
            } else {
                content.push(Localize.t('events.itSetsAccountMessageKeyTo', { messageKey: this.item.MessageKey }));
            }
        }

        if (typeof this.item.TransferRate !== 'undefined') {
            if (this.item.TransferRate === 0) {
                content.push(Localize.t('events.itRemovesTheAccountTransferRate'));
            } else {
                content.push(
                    Localize.t('events.itSetsAccountTransferRateTo', { transferRate: this.item.TransferRate }),
                );
            }
        }

        if (typeof this.item.NFTokenMinter !== 'undefined') {
            if (this.item.NFTokenMinter === '') {
                content.push(Localize.t('events.itRemovesTheAccountMinter'));
            } else {
                content.push(Localize.t('events.itSetsAccountMinterTo', { minter: this.item.NFTokenMinter }));
            }
        }

        if (typeof this.item.SetFlag !== 'undefined') {
            content.push(Localize.t('events.itSetsTheAccountFlag', { flag: this.item.SetFlag }));
        }

        if (typeof this.item.ClearFlag !== 'undefined') {
            content.push(Localize.t('events.itClearsTheAccountFlag', { flag: this.item.ClearFlag }));
        }

        if (typeof this.item.WalletLocator !== 'undefined') {
            if (this.item.WalletLocator === '') {
                content.push(Localize.t('events.itRemovesTheAccountWalletLocator'));
            } else {
                content.push(
                    Localize.t('events.itSetsAccountWalletLocatorTo', { walletLocator: this.item.WalletLocator }),
                );
            }
        }

        if (typeof this.item.WalletSize !== 'undefined') {
            if (this.item.WalletSize === 0) {
                content.push(Localize.t('events.itRemovesTheAccountWalletSize'));
            } else {
                content.push(Localize.t('events.itSetsAccountWalletSizeTo', { walletSize: this.item.WalletSize }));
            }
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default AccountSetInfo;
