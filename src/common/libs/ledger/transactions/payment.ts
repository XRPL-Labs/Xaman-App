import BigNumber from 'bignumber.js';
import { get, set, has, isUndefined, isNumber, toNumber } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

// import Localize from '@locale';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { LedgerAmount, Destination, AmountType } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class Payment extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'Payment';
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
        this.requiredFields = this.requiredFields.concat(['Amount', 'Destination']);
    }

    // public validate = (): ValidationResponse => {
    //     console.log(this.Amount);
    //     // check for required fields
    //     for (let i = 0; i < this.requiredFields.length; i++) {
    //         const field = this.requiredFields[i];

    //         if (!has(this, field)) {
    //             return {
    //                 valid: false,
    //                 error: Localize.t('global.fieldIsRequired', { field }),
    //             };
    //         }
    //     }

    //     return {
    //         valid: true,
    //         error: undefined,
    //     };
    // };

    get LastBalance(): any {
        const affectedNodes = get(this, ['meta', 'AffectedNodes']);

        if (!affectedNodes) return null;

        let source;
        let destination;

        // two effected node
        if (this.Type === 'Payment') {
            affectedNodes.forEach((node: any) => {
                const address = node.ModifiedNode.FinalFields.Account;
                const balance = node.ModifiedNode.FinalFields.Balance;

                if (this.Source.address === address) {
                    source = {
                        address,
                        balance,
                    };
                } else {
                    destination = {
                        address,
                        balance,
                    };
                }
            });
        }

        return {
            Account: source,
            Destination: destination,
        };
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);
        const destinationName = get(this, ['tx', 'DestinationName'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            name: destinationName,
            address: destination,
            tag: destinationTag,
        };
    }

    set Destination(destination: Destination) {
        if (!AccountLib.utils.isValidAddress(destination.address)) {
            throw new Error(`${destination.address} is not a valid XRP Address`);
        }

        if (destination.tag && !isNumber(destination.tag)) {
            // try to convert to number
            destination.tag = toNumber(destination.tag);
            if (!destination.tag) {
                throw new Error(`${destination.tag} is not a valid destination tag`);
            }
        }

        if (has(destination, 'name')) {
            set(this, 'tx.DestinationName', destination.name);
        }

        set(this, 'tx.Destination', destination.address);
        set(this, 'tx.DestinationTag', destination.tag);
    }

    // @ts-ignore
    get Amount(): AmountType {
        let amount;

        if (has(this, ['meta', 'DeliveredAmount'])) {
            amount = get(this, ['meta', 'DeliveredAmount']);
        } else {
            amount = get(this, ['meta', 'delivered_amount']);
        }

        if (!amount) {
            amount = get(this, ['tx', 'Amount']);
        }

        if (isUndefined(amount)) return undefined;

        if (typeof amount === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(amount).dropsToXrp(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value && new Amount(amount.value, false).toString(),
            issuer: amount.issuer,
        };
    }

    // @ts-ignore
    set Amount(input: LedgerAmount) {
        // XRP
        if (typeof input === 'string') {
            set(this, 'tx.Amount', new Amount(input, false).xrpToDrops());
        }

        if (typeof input === 'object') {
            let value = new BigNumber(input.value);

            // if transferRate set then add the fee to the value
            if (this.TransferRate) {
                const fee = value.multipliedBy(this.TransferRate).dividedBy(100);
                value = value.plus(fee);
            }

            set(this, 'tx.Amount', {
                currency: input.currency,
                value: value.toNumber().toString(10),
                issuer: input.issuer,
            });
        }
    }

    set TransferRate(rate: number) {
        const ratePercent = new BigNumber(rate)
            .dividedBy(1000000)
            .minus(1000)
            .dividedBy(10)
            .toNumber();
        set(this, ['tx', 'TransferRate'], ratePercent);
    }

    get TransferRate(): number {
        return get(this, 'tx.TransferRate', 0);
    }

    get SendMax(): AmountType {
        const sendMax = get(this, ['tx', 'SendMax'], undefined);

        if (!sendMax) {
            return undefined;
        }

        if (typeof sendMax === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(sendMax).dropsToXrp(),
            };
        }

        return {
            currency: sendMax.currency,
            value: sendMax.value && new Amount(sendMax.value, false).toString(),
            issuer: sendMax.issuer,
        };
    }

    set SendMax(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.SendMax', undefined);
            return;
        }
        // XRP
        if (typeof input === 'string') {
            set(this, 'tx.SendMax', new Amount(input, false).xrpToDrops());
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

        let value = new BigNumber(input.value);

        // if transferRate set then add the fee to the value
        if (this.TransferRate) {
            const fee = value.multipliedBy(this.TransferRate).dividedBy(100);
            value = value.plus(fee);
        }

        set(this, 'tx.DeliverMin', {
            currency: input.currency,
            value: value.toNumber().toString(10),
            issuer: input.issuer,
        });
    }

    get DeliverMin(): AmountType {
        const deliverMin = get(this, 'tx.DeliverMin', undefined);

        if (!deliverMin) {
            return undefined;
        }

        return deliverMin;
    }

    get InvoiceID(): string {
        const invoiceID = get(this, 'tx.InvoiceID', undefined);

        if (!invoiceID) {
            return undefined;
        }

        return invoiceID;
    }
}

/* Export ==================================================================== */
export default Payment;
