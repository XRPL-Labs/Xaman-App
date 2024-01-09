import { get, isUndefined, has } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import { Destination, AmountType } from '@common/libs/ledger/parser/types';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class AccountDelete extends BaseTransaction {
    public static Type = TransactionTypes.AccountDelete as const;
    public readonly Type = AccountDelete.Type;

    constructor(tx?: TransactionJson, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = AccountDelete.Type;
        }

        this.fields = this.fields.concat(['Destination', 'DestinationTag']);
    }

    get Amount(): AmountType {
        let amount;

        if (has(this, ['meta', 'DeliveredAmount'])) {
            amount = get(this, ['meta', 'DeliveredAmount']);
        } else {
            amount = get(this, ['meta', 'delivered_amount']);
        }

        // the delivered_amount will be unavailable in old transactions
        // not in this tx type, but better to check
        if (amount === 'unavailable') {
            amount = undefined;
        }

        if (isUndefined(amount)) return undefined;

        // as this only will be native currency we only check for string & number
        if (typeof amount === 'string' || typeof amount === 'number') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return undefined;
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }
}

/* Export ==================================================================== */
export default AccountDelete;
