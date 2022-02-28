import moment from 'moment-timezone';

import { set, get, isUndefined } from 'lodash';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import BaseTransaction from './base';
import CheckCreate from './checkCreate';

import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { TransactionJSONType } from '../types';

/* Class ==================================================================== */
class CheckCash extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'CheckCash';
        }

        this.fields = this.fields.concat(['Amount', 'DeliverMin', 'CheckID']);
    }

    get Amount(): AmountType {
        const amount = get(this, ['tx', 'Amount'], undefined);

        if (!amount) {
            return undefined;
        }

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

    set Amount(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.Amount', undefined);
            return;
        }
        // XRP
        if (typeof input === 'string') {
            set(this, 'tx.Amount', new Amount(input, false).xrpToDrops());
        }

        if (typeof input === 'object') {
            set(this, 'tx.Amount', {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
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

    set DeliverMin(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.DeliverMin', undefined);
            return;
        }
        // XRP
        if (typeof input === 'string') {
            set(this, 'tx.DeliverMin', new Amount(input, false).xrpToDrops());
        }

        if (typeof input === 'object') {
            set(this, 'tx.DeliverMin', {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
    }

    get CheckID(): string {
        return get(this, 'tx.CheckID', undefined);
    }

    set Check(check: CheckCreate) {
        set(this, 'check', check);
    }

    get Check(): CheckCreate {
        let check = get(this, 'check', undefined);

        // if we already set the check return
        if (check) {
            return check;
        }
        // if not look at the meta data for check object
        const affectedNodes = get(this.meta, 'AffectedNodes', []);
        affectedNodes.map((node: any) => {
            if (node.DeletedNode?.LedgerEntryType === 'Check') {
                check = new CheckCreate(node.DeletedNode.FinalFields);
            }
            return true;
        });

        return check;
    }

    get isExpired(): boolean {
        const date = get(this, ['Check', 'Expiration'], undefined);
        if (isUndefined(date)) return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }

    validate = () => {
        /* eslint-disable-next-line */
        return new Promise<void>((resolve, reject) => {
            if (!this.Check) {
                return reject(new Error(Localize.t('payload.unableToGetCheckObject')));
            }
            // The user must enter an amount
            if (
                (!this.Amount || !this.Amount?.value || this.Amount?.value === '0') &&
                (!this.DeliverMin || !this.DeliverMin?.value || this.DeliverMin?.value === '0')
            ) {
                return reject(new Error(Localize.t('send.pleaseEnterAmount')));
            }

            // check if the entered amount don't exceed the cash amount
            if (this.Amount && Number(this.Amount.value) > Number(this.Check.SendMax.value)) {
                return reject(
                    new Error(
                        Localize.t('payload.insufficientCashAmount', {
                            amount: this.Check.SendMax.value,
                            currency: NormalizeCurrencyCode(this.Check.SendMax.currency),
                        }),
                    ),
                );
            }

            if (this.DeliverMin && Number(this.DeliverMin.value) > Number(this.Check.SendMax.value)) {
                return reject(
                    new Error(
                        Localize.t('payload.insufficientCashAmount', {
                            amount: this.Check.SendMax.value,
                            currency: NormalizeCurrencyCode(this.Check.SendMax.currency),
                        }),
                    ),
                );
            }

            // the signer should be the same as check destination
            if (this.Account.address !== this.Check.Destination.address) {
                return reject(new Error(Localize.t('payload.checkCanOnlyCashByCheckDestination')));
            }

            return resolve();
        });
    };
}

/* Export ==================================================================== */
export default CheckCash;
