import BigNumber from 'bignumber.js';
import { get, set, has, isUndefined, isNumber, toInteger } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

import { AccountSchema } from '@store/schemas/latest';
import { NormalizeCurrencyCode } from '@common/libs/utils';

import Localize from '@locale';

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
    }

    get LastBalance(): any {
        const affectedNodes = get(this, ['meta', 'AffectedNodes']);

        if (!affectedNodes) return null;

        let source;
        let destination;

        // two effected node
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

        if (destination.tag) {
            if (!isNumber(destination.tag)) {
                // try to convert to number
                set(this, 'tx.DestinationTag', toInteger(destination.tag));
            } else {
                set(this, 'tx.DestinationTag', destination.tag);
            }
        } else {
            set(this, 'tx.DestinationTag', undefined);
        }

        if (has(destination, 'name')) {
            set(this, 'tx.DestinationName', destination.name);
        }

        set(this, 'tx.Destination', destination.address);
    }

    // @ts-ignore
    get Amount(): AmountType {
        let amount;

        if (has(this, ['meta', 'DeliveredAmount'])) {
            amount = get(this, ['meta', 'DeliveredAmount']);
        } else {
            amount = get(this, ['meta', 'delivered_amount']);
        }

        // the delivered_amount will be unavailable in old transactions
        if (amount === 'unavailable') {
            amount = undefined;
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
        const ratePercent = new BigNumber(rate).dividedBy(1000000).minus(1000).dividedBy(10);
        set(this, ['tx', 'TransferRate'], ratePercent.toNumber());
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

    validate = (source: AccountSchema) => {
        /* eslint-disable-next-line */
        return new Promise((resolve, reject) => {
            if (!this.Amount) {
                return reject(new Error(Localize.t('send.pleaseEnterAmount')));
            }

            // if XRP ||  IOU<>IOU & insufficient balance fallback to XRP >> check XRP Balance
            if (this.Amount.currency === 'XRP' || (this.SendMax && this.SendMax.currency === 'XRP')) {
                if (Number(this.Amount.value) > Number(source.availableBalance)) {
                    return reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: source.availableBalance,
                                currency: 'XRP',
                            }),
                        ),
                    );
                }
            } else if (source.address !== this.Amount.issuer) {
                // check if IOU<>IOU and sender is not issuer
                const line = source.lines.find(
                    (e: any) =>
                        e.currency.issuer === this.Amount.issuer && e.currency.currency === this.Amount.currency,
                );

                if (line && Number(this.Amount.value) > Number(line.balance)) {
                    return reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: line.balance,
                                currency: NormalizeCurrencyCode(line.currency.currency),
                            }),
                        ),
                    );
                }
            }

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default Payment;
