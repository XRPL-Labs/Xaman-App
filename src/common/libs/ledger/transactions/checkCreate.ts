import { has, get, set, isUndefined, isNumber, toInteger } from 'lodash';

import * as AccountLib from 'xrpl-accountlib';

import { AccountSchema } from '@store/schemas/latest';
import { NormalizeCurrencyCode } from '@common/libs/utils';

import Localize from '@locale';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class CheckCreate extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'CheckCreate';
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
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get InvoiceID(): string {
        return get(this, 'tx.InvoiceID', undefined);
    }

    validate = (source: AccountSchema) => {
        /* eslint-disable-next-line */
        return new Promise((resolve, reject) => {
            if (!this.SendMax || !this.SendMax?.value || this.SendMax?.value === '0') {
                return reject(new Error(Localize.t('send.pleaseEnterAmount')));
            }

            // this is a multisign tx & ignore balance check
            if (source.balance === 0) {
                return resolve();
            }

            if (this.SendMax.currency === 'XRP') {
                if (Number(this.SendMax.value) > Number(source.availableBalance)) {
                    return reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: Localize.formatNumber(source.availableBalance),
                                currency: 'XRP',
                            }),
                        ),
                    );
                }
            } else {
                const line = source.lines.find(
                    (e: any) =>
                        // eslint-disable-next-line implicit-arrow-linebreak
                        e.currency.issuer === this.SendMax.issuer && e.currency.currency === this.SendMax.currency,
                );

                if (line && Number(this.SendMax.value) > Number(line.balance)) {
                    return reject(
                        new Error(
                            Localize.t('send.insufficientBalanceSpendableBalance', {
                                spendable: Localize.formatNumber(line.balance),
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
export default CheckCreate;
