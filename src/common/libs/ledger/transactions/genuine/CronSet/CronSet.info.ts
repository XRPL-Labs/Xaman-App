import Localize from '@locale';
import moment from 'moment-timezone';

import { AccountModel } from '@store/models';

import CronSet from './CronSet.class';

/* types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class CronSetInfo extends ExplainerAbstract<CronSet, MutationsMixinType> {
    constructor(item: CronSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.cron');
    };

    generateDescription = (): string => {
        const content = [
            !this.item?.Flags?.tfCronUnset
                ? Localize.t('cronSet.didCreateOrUpdate')
                : Localize.t('cronSet.didRemoveCron'),
        ];

        if (typeof this.item.StartTime !== 'undefined') {
            content.push(Localize.t('cronSet.objStartTime', { value: moment(this.item.StartTime).format('LLLL') }));
        }

        if (typeof this.item.RepeatCount !== 'undefined') {
            content.push(Localize.t('cronSet.objRepeatCount', { value: this.item.RepeatCount }));
        }

        if (typeof this.item.DelaySeconds !== 'undefined') {
            content.push(Localize.t('cronSet.objDelaySeconds', { value: this.item.DelaySeconds }));
        }

        return content.join('\n\n');
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: undefined },
        };
    };

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================
================================== */
export default CronSetInfo;
