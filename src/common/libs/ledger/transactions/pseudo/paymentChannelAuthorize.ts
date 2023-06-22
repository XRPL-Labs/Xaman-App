import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '../../parser/common/amount';

import BasePseudoTransaction from './base';

/* Types ==================================================================== */
import { AmountType } from '../../parser/types';
import { PseudoTransactionTypes, TransactionJSONType } from '../../types';

/* Class ==================================================================== */
class PaymentChannelAuthorize extends BasePseudoTransaction {
    public static Type = PseudoTransactionTypes.PaymentChannelAuthorize as const;
    public readonly Type = PaymentChannelAuthorize.Type;

    constructor(tx?: TransactionJSONType) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = PseudoTransactionTypes.PaymentChannelAuthorize;
        }

        this.fields = this.fields.concat(['Channel', 'Amount']);
    }

    get Channel(): string {
        const channel = get(this, ['tx', 'Channel']);

        if (isUndefined(channel)) return undefined;

        return channel;
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
}

/* Export ==================================================================== */
export default PaymentChannelAuthorize;
