import moment from 'moment-timezone';

import Localize from '@locale';

import { AccountModel } from '@store/models';

import Cron from './Cron.class';

/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class CronInfo extends ExplainerAbstract<Cron> {
    constructor(item: Cron, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('cronSet.objectName');
    }

    generateDescription(): string {
        const content = [];

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
    }

    getParticipants() {
        return {
            // start: { address: this.item.Owner, tag: undefined },
            // through: { address: this.item.Owner, tag: undefined },
            end: { address: this.item.Owner, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
        };
    }
}

/* Export ==================================================================== */
export default CronInfo;
