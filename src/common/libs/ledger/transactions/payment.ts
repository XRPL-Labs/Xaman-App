/* eslint-disable no-lonely-if */
import BigNumber from 'bignumber.js';
import { get, set, has, isUndefined, isNumber, toInteger } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

import LedgerService from '@services/LedgerService';

import { AccountSchema } from '@store/schemas/latest';

import { NormalizeCurrencyCode, NormalizeAmount } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

import Localize from '@locale';

import BaseTransaction from './base';

import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { LedgerAmount, Destination, AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

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
                throw new Error(`${destination.address} is not a valid XRP Address`);
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
                currency: 'XRP',
                value: new Amount(deliveredAmount).dropsToXrp(),
            };
        }

        return {
            currency: deliveredAmount.currency,
            value: deliveredAmount.value && new Amount(deliveredAmount.value, false).toString(),
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
            const value = new BigNumber(input.value);

            set(this, 'tx.Amount', {
                currency: input.currency,
                value: value.toNumber().toString(10),
                issuer: input.issuer,
            });
        }
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

        // XRP
        if (typeof input === 'string') {
            set(this, 'tx.DeliverMin', new Amount(input, false).xrpToDrops());
            return;
        }

        set(this, 'tx.DeliverMin', {
            currency: input.currency,
            value: new BigNumber(input.value).toNumber().toString(10),
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
                currency: 'XRP',
                value: new Amount(deliverMin).dropsToXrp(),
            };
        }

        return {
            currency: deliverMin.currency,
            value: deliverMin.value && new Amount(deliverMin.value, false).toString(),
            issuer: deliverMin.issuer,
        };
    }

    get InvoiceID(): string {
        const invoiceID = get(this, 'tx.InvoiceID', undefined);

        if (!invoiceID) {
            return undefined;
        }

        return invoiceID;
    }

    set InvoiceID(invoiceId: string) {
        set(this, 'tx.InvoiceID', invoiceId);
    }

    get Paths(): Array<any> {
        return get(this, 'tx.Paths', undefined);
    }

    validate = (source: AccountSchema, multiSign?: boolean): Promise<void> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // ignore validation if multiSign and payload including Path
                if (multiSign || this.Paths) {
                    resolve();
                    return;
                }

                // check if amount is present
                if (!this.Amount || !this.Amount?.value || this.Amount?.value === '0') {
                    reject(new Error(Localize.t('send.pleaseEnterAmount')));
                    return;
                }

                let XRPAmount = undefined as AmountType;

                // SendMax have higher priority
                if (this.SendMax && this.SendMax.currency === 'XRP') {
                    XRPAmount = this.SendMax;
                } else if (this.Amount.currency === 'XRP' && !this.SendMax) {
                    XRPAmount = this.Amount;
                }

                if (XRPAmount) {
                    // ===== check balance =====
                    const availableBalance = CalculateAvailableBalance(source);
                    if (Number(XRPAmount.value) > Number(availableBalance)) {
                        reject(
                            new Error(
                                Localize.t('send.insufficientBalanceSpendableBalance', {
                                    spendable: Localize.formatNumber(availableBalance),
                                    currency: 'XRP',
                                }),
                            ),
                        );
                        return;
                    }
                }

                let IOUAmount = undefined as AmountType;

                // SendMax have higher priority
                if (this.SendMax && this.SendMax.currency !== 'XRP') {
                    IOUAmount = this.SendMax;
                } else if (this.Amount.currency !== 'XRP' && !this.SendMax) {
                    IOUAmount = this.Amount;
                }

                if (IOUAmount) {
                    // ===== check if recipient have same trustline for receiving IOU =====
                    // ignore if sending to the issuer
                    if (IOUAmount.issuer !== this.Destination.address) {
                        const destinationLine = await LedgerService.getFilteredAccountLine(
                            this.Destination.address,
                            IOUAmount,
                        );
                        if (
                            !destinationLine ||
                            (Number(destinationLine.limit) === 0 && Number(destinationLine.balance) === 0)
                        ) {
                            reject(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                            return;
                        }
                    }

                    // ===== check balances =====
                    // sender is not issuer
                    if (IOUAmount.issuer !== source.address) {
                        // check IOU balance
                        const line = source.lines.find(
                            (e: any) =>
                                // eslint-disable-next-line implicit-arrow-linebreak
                                e.currency.issuer === IOUAmount.issuer && e.currency.currency === IOUAmount.currency,
                        );

                        // TODO: show proper error message
                        if (!line) {
                            resolve();
                            return;
                        }

                        if (Number(IOUAmount.value) > Number(line.balance)) {
                            reject(
                                new Error(
                                    Localize.t('send.insufficientBalanceSpendableBalance', {
                                        spendable: Localize.formatNumber(NormalizeAmount(line.balance)),
                                        currency: NormalizeCurrencyCode(line.currency.currency),
                                    }),
                                ),
                            );
                            return;
                        }
                    } else {
                        // sender is the issuer
                        // check for exceed the trustline Limit on obligations
                        const sourceLine = await LedgerService.getFilteredAccountLine(source.address, {
                            issuer: this.Destination.address,
                            currency: IOUAmount.currency,
                        });

                        // TODO: show proper error message
                        if (!sourceLine) {
                            resolve();
                            return;
                        }

                        if (
                            Number(IOUAmount.value) + Math.abs(Number(sourceLine.balance)) >
                            Number(sourceLine.limit_peer)
                        ) {
                            reject(
                                new Error(
                                    Localize.t('send.trustLineLimitExceeded', {
                                        balance: Localize.formatNumber(
                                            NormalizeAmount(Math.abs(Number(sourceLine.balance))),
                                        ),
                                        peer_limit: Localize.formatNumber(
                                            NormalizeAmount(Number(sourceLine.limit_peer)),
                                        ),
                                        available: Localize.formatNumber(
                                            NormalizeAmount(
                                                Number(
                                                    Number(sourceLine.limit_peer) -
                                                        Math.abs(Number(sourceLine.balance)),
                                                ),
                                            ),
                                        ),
                                    }),
                                ),
                            );
                            return;
                        }
                    }
                }
                resolve();
            } catch (e) {
                reject(
                    new Error(
                        // eslint-disable-next-line max-len
                        'An unexpected error occurred while validating the transaction.\n\nPlease try again later, if the problem continues, contact XUMM support.',
                    ),
                );
            }
        });
    };
}

/* Export ==================================================================== */
export default Payment;
