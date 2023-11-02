import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

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

        if (typeof amount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value,
            issuer: amount.issuer,
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
