import Localize from '@locale';

import { AccountModel } from '@store/models';

import DepositPreauth from './DepositPreauth.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Class ==================================================================== */
class DepositPreauthInfo extends ExplainerAbstract<DepositPreauth, MutationsMixinType> {
    constructor(item: DepositPreauth & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (this.item.Authorize) {
            return Localize.t('events.authorizeDeposit');
        }

        if (this.item.Unauthorize) {
            return Localize.t('events.unauthorizeDeposit');
        }

        return this.item.Type;
    }

    generateDescription(): string {
        if (this.item.Authorize) {
            return Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', { address: this.item.Authorize });
        }

        if (this.item.Unauthorize) {
            return Localize.t('events.itRemovesAuthorizesSendingPaymentsToThisAccount', {
                address: this.item.Unauthorize,
            });
        }

        return 'No description, "Authorize" and "Unauthorize" field has not been set.';
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Authorize || this.item.Unauthorize, tag: undefined },
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
export default DepositPreauthInfo;
