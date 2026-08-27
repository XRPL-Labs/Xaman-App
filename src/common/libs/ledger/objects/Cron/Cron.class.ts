import moment from 'moment-timezone';

import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { Cron as CronLedgerEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Cron extends BaseLedgerObject<CronLedgerEntry> {
    public static Type = LedgerEntryTypes.Cron as const;
    public readonly Type = Cron.Type;

    public static Fields = {
        Owner: { type: AccountID },
        StartTime: { type: UInt32, codec: RippleTime },
        RepeatCount: { type: UInt32 },
        DelaySeconds: { type: UInt32 },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare StartTime: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare RepeatCount: FieldReturnType<typeof UInt32>;
    declare DelaySeconds: FieldReturnType<typeof UInt32>;

    constructor(object: CronLedgerEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Cron;
    }

    get Date(): any {
        return this?.StartTime;
    }

    get isExpired(): boolean {
        if (typeof this.StartTime === 'undefined') return false;

        const exp = moment.utc(this.StartTime);
        const now = moment().utc();
        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default Cron;
