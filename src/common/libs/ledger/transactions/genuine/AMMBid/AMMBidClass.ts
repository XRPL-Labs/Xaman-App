import { flatMap, get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, AuthAccount, IssueType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class AMMBid extends BaseTransaction {
    public static Type = TransactionTypes.AMMBid as const;
    public readonly Type = AMMBid.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AMMBid.Type;
        }

        this.fields = this.fields.concat(['Asset', 'Asset2', 'BidMin', 'BidMax', 'AuthAccounts']);
    }

    get Asset(): IssueType {
        return get(this, ['tx', 'Asset']);
    }

    get Asset2(): IssueType {
        return get(this, ['tx', 'Asset2']);
    }

    get BidMin(): AmountType {
        const bidMin = get(this, ['tx', 'BidMin']);

        if (isUndefined(bidMin)) return undefined;

        if (typeof bidMin === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(bidMin).dropsToNative(),
            };
        }

        return {
            currency: bidMin.currency,
            value: bidMin.value,
            issuer: bidMin.issuer,
        };
    }

    get BidMax(): AmountType {
        const bidMax = get(this, ['tx', 'BidMax']);

        if (isUndefined(bidMax)) return undefined;

        if (typeof bidMax === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(bidMax).dropsToNative(),
            };
        }

        return {
            currency: bidMax.currency,
            value: bidMax.value,
            issuer: bidMax.issuer,
        };
    }

    get AuthAccounts(): Array<AuthAccount> {
        const accounts = get(this, ['tx', 'AuthAccounts']);

        return flatMap(accounts, (entry) => {
            return {
                account: entry.AuthAccount.Account,
            };
        });
    }
}

/* Export ==================================================================== */
export default AMMBid;
