// import moment from 'moment-timezone';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Class ==================================================================== */
class CronSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.CronSet as const;
    public readonly Type = CronSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        StartTime: { required: true, type: UInt32, codec: RippleTime },
        RepeatCount: { required: true, type: UInt32 },
        DelaySeconds: { required: true, type: UInt32 },
    };

    declare StartTime: FieldReturnType<typeof UInt32>;
    declare RepeatCount: FieldReturnType<typeof UInt32>;
    declare DelaySeconds: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CronSet.Type;
    }

    // get isExpired(): boolean {
    //     if (typeof date === 'undefined') return false;

    //     const exp = moment.utc(date);
    //     const now = moment().utc();

    //     return exp.isBefore(now);
    // }
}

/* Export ==================================================================== */
export default CronSet;
