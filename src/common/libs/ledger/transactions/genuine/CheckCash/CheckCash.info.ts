import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import CheckCash from './CheckCash.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Class Declaration ==================================================================== */
class CheckCashInfo extends ExplainerAbstract<CheckCash, MutationsMixinType> {
    constructor(item: CheckCash & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.cashCheck');
    }

    generateDescription(): string {
        const amount = this.item.Amount || this.item.DeliverMin;

        if (!amount) {
            return 'Amount or DeliverMin field is required!';
        }

        return Localize.t('events.itWasInstructedToDeliverByCashingCheck', {
            address: this.item.Check!.Destination,
            amount: amount.value,
            currency: NormalizeCurrencyCode(amount.currency),
            checkId: this.item.CheckID,
        });
    }

    getParticipants() {
        return {
            start: { address: this.item.Check!.Account, tag: undefined },
            end: { address: this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.Amount!.currency,
                value: this.item.Amount!.value,
                effect: MonetaryStatus.IMMEDIATE_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default CheckCashInfo;
