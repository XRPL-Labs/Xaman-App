import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';

import BasePseudoTransaction from '@common/libs/ledger/transactions/pseudo/BasePseudo';

/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class PaymentChannelAuthorize extends BasePseudoTransaction {
    public static Type = PseudoTransactionTypes.PaymentChannelAuthorize as const;
    public readonly Type = PaymentChannelAuthorize.Type;

    constructor(tx?: TransactionJson) {
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
