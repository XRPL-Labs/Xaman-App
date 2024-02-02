import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import BigNumber from 'bignumber.js';

/* Class ==================================================================== */
class AMMCreate extends BaseTransaction {
    public static Type = TransactionTypes.AMMCreate as const;
    public readonly Type = AMMCreate.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AMMCreate.Type;
        }

        this.fields = this.fields.concat(['Amount', 'Amount2', 'TradingFee']);
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

    get Amount2(): AmountType {
        const amount2 = get(this, ['tx', 'Amount2']);

        if (isUndefined(amount2)) return undefined;

        if (typeof amount2 === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount2).dropsToNative(),
            };
        }

        return {
            currency: amount2.currency,
            value: amount2.value,
            issuer: amount2.issuer,
        };
    }

    get TradingFee(): number {
        const tradingFee = get(this, ['tx', 'TradingFee'], undefined);

        if (isUndefined(tradingFee)) return undefined;

        return new BigNumber(tradingFee).dividedBy(1000).toNumber();
    }
}

/* Export ==================================================================== */
export default AMMCreate;
