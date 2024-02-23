import Localize from '@locale';

import { AccountModel } from '@store/models';

import ClaimReward from './ClaimReward.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class ClaimRewardInfo extends ExplainerAbstract<ClaimReward & MutationsMixinType> {
    constructor(item: ClaimReward & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        switch (this.item.ClaimStatus) {
            case ClaimRewardStatus.OptIn:
                return Localize.t('events.claimReward');
            case ClaimRewardStatus.OptOut:
                return Localize.t('events.claimRewardOptOut');
            default:
                return Localize.t('events.claimReward');
        }
    }

    generateDescription(): string {
        const content = [Localize.t('events.claimRewardExplain')];

        if (this.item.ClaimStatus === ClaimRewardStatus.OptOut) {
            content.push(Localize.t('events.claimRewardExplainOptOut', { address: this.item.Account }));
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
export default ClaimRewardInfo;
