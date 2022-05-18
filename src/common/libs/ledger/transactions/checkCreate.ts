import { has, get, set, isUndefined, isNumber, toInteger } from 'lodash';

import * as AccountLib from 'xrpl-accountlib';

import { ErrorMessages } from '@common/constants';
import { NormalizeCurrencyCode } from '@common/utils/amount';

import LedgerService from '@services/LedgerService';

import Localize from '@locale';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class CheckCreate extends BaseTransaction {
    public static Type = TransactionTypes.CheckCreate as const;
    public readonly Type = CheckCreate.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = CheckCreate.Type;
        }

        this.fields = this.fields.concat(['Destination', 'SendMax', 'DestinationTag', 'Expiration', 'InvoiceID']);
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
            set(this, ['tx', 'SendMax'], undefined);
            return;
        }
        // XRP
        if (typeof input === 'string') {
            set(this, ['tx', 'SendMax'], new Amount(input, false).xrpToDrops());
        }

        if (typeof input === 'object') {
            set(this, ['tx', 'SendMax'], {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
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
            set(this, ['tx', 'Destination'], destination.address);
        }

        if (has(destination, 'tag')) {
            if (!isNumber(destination.tag)) {
                // try to convert to number
                set(this, ['tx', 'DestinationTag'], toInteger(destination.tag));
            } else {
                set(this, ['tx', 'DestinationTag'], destination.tag);
            }
        } else {
            set(this, ['tx', 'DestinationTag'], undefined);
        }
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get InvoiceID(): string {
        return get(this, ['tx', 'InvoiceID'], undefined);
    }

    validate = (): Promise<void> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // check if check amount is set
                if (!this.SendMax || !this.SendMax?.value || this.SendMax?.value === '0') {
                    reject(new Error(Localize.t('send.pleaseEnterAmount')));
                    return;
                }

                // check if the Check Amount is exceeding the balance
                if (this.SendMax.currency === 'XRP') {
                    try {
                        // fetch fresh account balance from ledger
                        const availableBalance = await LedgerService.getAccountAvailableBalance(this.Account.address);

                        if (Number(this.SendMax.value) > Number(availableBalance)) {
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
                    } catch {
                        reject(Localize.t('account.unableGetAccountInfo'));
                        return;
                    }
                } else {
                    // get TrustLine from ledger
                    const line = await LedgerService.getFilteredAccountLine(this.Account.address, this.SendMax);

                    // check if line exist
                    if (line && Number(this.SendMax.value) > Number(line.balance)) {
                        reject(
                            new Error(
                                Localize.t('send.insufficientBalanceSpendableBalance', {
                                    spendable: Localize.formatNumber(Number(line.balance)),
                                    currency: NormalizeCurrencyCode(line.currency),
                                }),
                            ),
                        );
                        return;
                    }
                }

                // everything seems fine, resolve
                resolve();
            } catch {
                reject(new Error(ErrorMessages.unexpectedValidationError));
            }
        });
    };
}

/* Export ==================================================================== */
export default CheckCreate;
