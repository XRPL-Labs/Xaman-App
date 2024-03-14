import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, UInt32 } from '@common/libs/ledger/parser/fields';

import NetworkService from '@services/NetworkService';

import { AmountParser } from '@common/libs/ledger/parser/common';
/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AccountDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.AccountDelete as const;
    public readonly Type = AccountDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Destination: { required: true, type: AccountID },
        DestinationTag: { type: UInt32 },
    };

    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AccountDelete.Type;
    }

    get DeliveredAmount(): AmountType | undefined {
        let deliveredAmount: any | 'unavailable';

        if (this._meta?.DeliveredAmount) {
            deliveredAmount = this._meta?.DeliveredAmount;
        } else {
            deliveredAmount = this._meta?.delivered_amount;
        }

        if (typeof deliveredAmount === 'undefined') return undefined;

        if (typeof deliveredAmount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new AmountParser(deliveredAmount).dropsToNative().toString(),
            };
        }

        return {
            currency: deliveredAmount.currency,
            value: deliveredAmount.value,
            issuer: deliveredAmount.issuer,
        };
    }
}

/* Export ==================================================================== */
export default AccountDelete;
