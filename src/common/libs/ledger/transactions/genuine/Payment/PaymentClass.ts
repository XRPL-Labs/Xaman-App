import { get, set, has, isUndefined, isNumber, toInteger } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { LedgerAmount, Destination, AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class Payment extends BaseTransaction {
    public static Type = TransactionTypes.Payment as const;
    public readonly Type = Payment.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = Payment.Type;
        }

        this.fields = this.fields.concat([
            'Destination',
            'DestinationTag',
            'InvoiceID',
            'Paths',
            'Amount',
            'SendMax',
            'DeliverMin',
        ]);
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

    set Destination(destination: Destination) {
        if (has(destination, 'address')) {
            if (!AccountLib.utils.isValidAddress(destination.address)) {
                throw new Error(`${destination.address} is not a valid Address`);
            }
            set(this, 'tx.Destination', destination.address);
        }

        if (has(destination, 'tag')) {
            const tag = get(destination, 'tag', undefined);
            if (tag !== undefined && tag !== null && tag !== '') {
                // try to convert to number if not
                if (!isNumber(tag)) {
                    set(this, 'tx.DestinationTag', toInteger(tag));
                } else {
                    set(this, 'tx.DestinationTag', tag);
                }
            } else {
                set(this, 'tx.DestinationTag', undefined);
            }
        }
    }

    get DeliveredAmount(): AmountType {
        let deliveredAmount = undefined as AmountType;

        if (has(this, ['meta', 'DeliveredAmount'])) {
            deliveredAmount = get(this, ['meta', 'DeliveredAmount']);
        } else {
            deliveredAmount = get(this, ['meta', 'delivered_amount']);
        }

        // the delivered_amount will be unavailable in old transactions
        // @ts-ignore
        if (deliveredAmount === 'unavailable') {
            deliveredAmount = undefined;
        }

        if (isUndefined(deliveredAmount)) return undefined;

        if (typeof deliveredAmount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(deliveredAmount).dropsToNative(),
            };
        }

        return {
            currency: deliveredAmount.currency,
            value: deliveredAmount.value,
            issuer: deliveredAmount.issuer,
        };
    }

    // @ts-ignore
    get Amount(): AmountType {
        let amount = undefined as AmountType;

        amount = get(this, ['tx', 'Amount']);

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

    // @ts-ignore
    set Amount(input: LedgerAmount) {
        // native currency
        if (typeof input === 'string') {
            set(this, 'tx.Amount', new Amount(input, false).nativeToDrops());
        }

        if (typeof input === 'object') {
            set(this, 'tx.Amount', {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
    }

    // @ts-ignore
    get SendMax(): AmountType {
        const sendMax = get(this, ['tx', 'SendMax'], undefined);

        if (!sendMax) {
            return undefined;
        }

        if (typeof sendMax === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(sendMax).dropsToNative(),
            };
        }

        return {
            currency: sendMax.currency,
            value: sendMax.value,
            issuer: sendMax.issuer,
        };
    }

    set SendMax(input: LedgerAmount) {
        if (typeof input === 'undefined') {
            set(this, 'tx.SendMax', undefined);
            return;
        }
        // native currency
        if (typeof input === 'string') {
            set(this, 'tx.SendMax', new Amount(input, false).nativeToDrops());
        }

        if (typeof input === 'object') {
            set(this, 'tx.SendMax', {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
    }

    set DeliverMin(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.DeliverMin', undefined);
            return;
        }

        // native currency
        if (typeof input === 'string') {
            set(this, 'tx.DeliverMin', new Amount(input, false).nativeToDrops());
            return;
        }

        set(this, 'tx.DeliverMin', {
            currency: input.currency,
            value: input.value,
            issuer: input.issuer,
        });
    }

    get DeliverMin(): AmountType {
        const deliverMin = get(this, ['tx', 'DeliverMin'], undefined);

        if (!deliverMin) {
            return undefined;
        }

        if (typeof deliverMin === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(deliverMin).dropsToNative(),
            };
        }

        return {
            currency: deliverMin.currency,
            value: deliverMin.value,
            issuer: deliverMin.issuer,
        };
    }

    get InvoiceID(): string {
        return get(this, 'tx.InvoiceID', undefined);
    }

    set InvoiceID(invoiceId: string) {
        set(this, 'tx.InvoiceID', invoiceId);
    }

    get Paths(): Array<any> {
        return get(this, 'tx.Paths', undefined);
    }

    set Paths(path: Array<any>) {
        set(this, 'tx.Paths', path);
    }
}

/* Export ==================================================================== */
export default Payment;
