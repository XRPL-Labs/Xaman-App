import { get, isUndefined } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class PaymentChannelFund extends BaseTransaction {
    public static Type = TransactionTypes.PaymentChannelFund as const;
    public readonly Type = PaymentChannelFund.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = PaymentChannelFund.Type;
        }

        this.fields = this.fields.concat(['Channel', 'Amount', 'Expiration']);
    }

    get Channel(): string {
        return get(this, ['tx', 'Channel']);
    }

    get Amount(): AmountType {
        const amount = get(this, ['tx', 'Amount']);

        if (isUndefined(amount)) return undefined;

        return {
            currency: 'XRP',
            value: new Amount(amount).dropsToXrp(),
        };
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }
}

/* Export ==================================================================== */
export default PaymentChannelFund;
