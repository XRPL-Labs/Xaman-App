import Localize from '@locale';

import { AccountModel } from '@store/models';

import SetRegularKey from './SetRegularKey.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class SetRegularKeyInfo extends ExplainerAbstract<SetRegularKey, MutationsMixinType> {
    constructor(item: SetRegularKey & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        if (this.item.RegularKey) {
            return Localize.t('events.setRegularKey');
        }
        return Localize.t('events.removeRegularKey');
    }

    generateDescription(): string {
        const { RegularKey } = this.item;

        const content: string[] = [Localize.t('events.thisIsAnSetRegularKeyTransaction')];

        if (RegularKey) {
            content.push(Localize.t('events.itSetsAccountRegularKeyTo', { regularKey: RegularKey }));
        } else {
            content.push(Localize.t('events.itRemovesTheAccountRegularKey'));
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.RegularKey ? { address: this.item.RegularKey, tag: undefined } : undefined,
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
export default SetRegularKeyInfo;
