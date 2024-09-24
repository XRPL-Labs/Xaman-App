import moment from 'moment-timezone';
import { set, get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';
import { CheckCreate } from '@common/libs/ledger/transactions/genuine/CheckCreate';

import Amount from '@common/libs/ledger/parser/common/amount';

/* Types ==================================================================== */
import { AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class CheckCash extends BaseTransaction {
    public static Type = TransactionTypes.CheckCash as const;
    public readonly Type = CheckCash.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = CheckCash.Type;
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

    set Amount(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.Amount', undefined);
            return;
        }
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

    set DeliverMin(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, 'tx.DeliverMin', undefined);
            return;
        }
        // native currency
        if (typeof input === 'string') {
            set(this, 'tx.DeliverMin', new Amount(input, false).nativeToDrops());
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
        // if not look at the metadata for check object
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
}

/* Export ==================================================================== */
export default CheckCash;
