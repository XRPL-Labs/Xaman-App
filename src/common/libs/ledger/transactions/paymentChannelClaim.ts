import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { AmountType } from '../parser/types';
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class PaymentChannelClaim extends BaseTransaction {
    public static Type = TransactionTypes.PaymentChannelClaim as const;
    public readonly Type = PaymentChannelClaim.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = PaymentChannelClaim.Type;
        }

        this.fields = this.fields.concat(['Channel', 'Balance', 'Amount', 'Signature', 'PublicKey']);
    }

    get Channel(): string {
        return get(this, ['tx', 'Channel']);
    }

    get Balance(): AmountType {
        const balance = get(this, ['tx', 'Balance']);

        if (isUndefined(balance)) return undefined;

        if (typeof balance === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(balance).dropsToNative(),
            };
        }

        return {
            currency: balance.currency,
            value: balance.value,
            issuer: balance.issuer,
        };
    }

    get Amount(): AmountType {
        const amount = get(this, ['tx', 'Amount']);

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

    get Signature(): string {
        return get(this, ['tx', 'Signature']);
    }

    get PublicKey(): string {
        return get(this, ['tx', 'PublicKey']);
    }

    get IsClosed(): boolean {
        let closed = false;

        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        affectedNodes.map((node: any) => {
            if (node.DeletedNode?.LedgerEntryType === 'PayChannel') {
                closed = true;
                return true;
            }
            return false;
        });

        return closed;
    }
}

/* Export ==================================================================== */
export default PaymentChannelClaim;
