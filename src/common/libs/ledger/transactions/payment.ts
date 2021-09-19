/* eslint-disable no-lonely-if */
import BigNumber from 'bignumber.js';
import { get, set, has, isUndefined, isNumber, toInteger, findIndex } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

import LedgerService from '@services/LedgerService';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { NormalizeCurrencyCode, NormalizeAmount } from '@common/utils/amount';

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

        if (has(destination, 'name')) {
            set(this, 'tx.DestinationName', destination.name);
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

    validate = (source: AccountSchema, multiSign?: boolean) => {
        /* eslint-disable-next-line */
        return new Promise<void>(async (resolve, reject) => {
            // ignore validation if multiSign
            if (multiSign) {
                return resolve();
            }

            if (!this.Amount || !this.Amount?.value || this.Amount?.value === '0') {
                return reject(new Error(Localize.t('send.pleaseEnterAmount')));
            }

            // Sending XRP
            if (this.Amount.currency === 'XRP' || (this.SendMax && this.SendMax.currency === 'XRP')) {
                const XRPAmount = (this.SendMax && this.SendMax.value) || this.Amount.value;

                // ===== check balance =====
                if (Number(XRPAmount) > Number(AccountRepository.calculateAvailableBalance(source))) {
                    return reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: Localize.formatNumber(AccountRepository.calculateAvailableBalance(source)),
                                currency: 'XRP',
                            }),
                        ),
                    );
                }
            } else {
                // Sending IOU

                // ===== check if recipient have same trustline for sending IOU =====
                const destinationLinesResp = await LedgerService.getAccountLines(this.Destination.address);
                const { lines: destinationLines } = destinationLinesResp;

                const haveSameTrustLine =
                    findIndex(destinationLines, (l: any) => {
                        return l.currency === this.Amount.currency && l.account === this.Amount.issuer;
                    }) !== -1;

                if (!haveSameTrustLine && this.Amount.issuer !== this.Destination.address) {
                    return reject(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                }

                // ===== check balances =====
                // sender is not issuer
                if (source.address !== this.Amount.issuer) {
                    // check IOU balance
                    const line = source.lines.find(
                        (e: any) =>
                            // eslint-disable-next-line implicit-arrow-linebreak
                            e.currency.issuer === this.Amount.issuer && e.currency.currency === this.Amount.currency,
                    );

                    if (!line) return resolve();

                    if (Number(this.Amount.value) > Number(line.balance)) {
                        return reject(
                            new Error(
                                Localize.t('send.insufficientBalanceSpendableBalance', {
                                    spendable: Localize.formatNumber(NormalizeAmount(line.balance)),
                                    currency: NormalizeCurrencyCode(line.currency.currency),
                                }),
                            ),
                        );
                    }
                    // sender is the issuer
                } else {
                    // check for exceed the trustline Limit on obligations
                    const sourceLines = await LedgerService.getAccountLines(source.address);

                    const { lines } = sourceLines;

                    const trustLine = lines.filter(
                        (l: any) => l.currency === this.Amount.currency && l.account === this.Destination.address,
                    )[0];

                    if (Number(this.Amount.value) + Math.abs(trustLine.balance) > Number(trustLine.limit_peer)) {
                        return reject(
                            new Error(
                                Localize.t('send.trustLineLimitExceeded', {
                                    balance: Localize.formatNumber(NormalizeAmount(Math.abs(trustLine.balance))),
                                    peer_limit: Localize.formatNumber(NormalizeAmount(trustLine.limit_peer)),
                                    available: Localize.formatNumber(
                                        NormalizeAmount(Number(trustLine.limit_peer - Math.abs(trustLine.balance))),
                                    ),
                                }),
                            ),
                        );
                    }
                }
            }

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default Payment;
