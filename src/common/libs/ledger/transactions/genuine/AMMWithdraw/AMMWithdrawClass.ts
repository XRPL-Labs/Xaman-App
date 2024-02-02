import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, IssueType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class AMMWithdraw extends BaseTransaction {
    public static Type = TransactionTypes.AMMWithdraw as const;
    public readonly Type = AMMWithdraw.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AMMWithdraw.Type;
        }

        this.fields = this.fields.concat(['Asset', 'Asset2', 'Amount', 'Amount2', 'EPrice', 'LPTokenIn']);
    }

    get Asset(): IssueType {
        return get(this, ['tx', 'Asset']);
    }

    get Asset2(): IssueType {
        return get(this, ['tx', 'Asset2']);
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

    get EPrice(): AmountType {
        const ePrice = get(this, ['tx', 'EPrice']);

        if (isUndefined(ePrice)) return undefined;

        if (typeof ePrice === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(ePrice).dropsToNative(),
            };
        }

        return {
            currency: ePrice.currency,
            value: ePrice.value,
            issuer: ePrice.issuer,
        };
    }

    get LPTokenIn(): AmountType {
        const lPTokenIn = get(this, ['tx', 'LPTokenIn']);

        if (isUndefined(lPTokenIn)) return undefined;

        if (typeof lPTokenIn === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(lPTokenIn).dropsToNative(),
            };
        }

        return {
            currency: lPTokenIn.currency,
            value: lPTokenIn.value,
            issuer: lPTokenIn.issuer,
        };
    }
}

/* Export ==================================================================== */
export default AMMWithdraw;
