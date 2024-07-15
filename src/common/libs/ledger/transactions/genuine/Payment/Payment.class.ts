import NetworkService from '@services/NetworkService';

import { AmountParser } from '@common/libs/ledger/parser/common';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Amount, Hash256, PathSet, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { AmountType } from '@common/libs/ledger/parser/types';

/* Class ==================================================================== */
class Payment extends BaseGenuineTransaction {
    public static Type = TransactionTypes.Payment as const;
    public readonly Type = Payment.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { required: true, type: Amount },
        Destination: { required: true, type: AccountID },
        DestinationTag: { type: UInt32 },
        InvoiceID: { type: Hash256 },
        SendMax: { type: Amount },
        DeliverMin: { type: Amount },
        Paths: { type: PathSet },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare InvoiceID: FieldReturnType<typeof Hash256>;
    declare SendMax: FieldReturnType<typeof Amount>;
    declare DeliverMin: FieldReturnType<typeof Amount>;
    declare Paths?: FieldReturnType<typeof PathSet>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = Payment.Type;
    }

    get DeliveredAmount(): AmountType | undefined {
        let deliveredAmount: any | 'unavailable';

        if (this._meta?.DeliveredAmount) {
            deliveredAmount = this._meta?.DeliveredAmount;
        } else {
            deliveredAmount = this._meta?.delivered_amount;
        }

        // the delivered_amount will be unavailable in old transactions, use Amount field instead
        if (deliveredAmount === 'unavailable' || deliveredAmount === null || typeof deliveredAmount === 'undefined') {
            return this.Amount;
        }

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
export default Payment;
